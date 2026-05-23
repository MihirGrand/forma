import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const securityHeaders = {
	'cross-origin-opener-policy': 'same-origin',
	'cross-origin-resource-policy': 'same-origin',
	'origin-agent-cluster': '?1',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' ,
	'referrer-policy': 'no-referrer',
	'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
	'x-content-type-options': 'nosniff',
	'x-frame-options': 'DENY',
	'x-robots-tag': 'noindex, nofollow, noarchive, nosnippet',
	'x-xss-protection': '0'
};

const cspByPath = () => {
	return [
		"default-src 'self'",
		"base-uri 'self'",
		"frame-ancestors 'none'",
		"form-action 'self'",
		`connect-src 'self' ${PUBLIC_SUPABASE_URL}`,
		`img-src 'self' data: blob: ${PUBLIC_SUPABASE_URL}`,
		`font-src 'self' data: ${PUBLIC_SUPABASE_URL} https://fonts.gstatic.com`,
		"object-src 'none'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
	].join('; ');
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.getSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

    const session = await event.locals.getSession();
    const { data: { user } } = await event.locals.supabase.auth.getUser();
    
    event.locals.session = session;
    event.locals.user = user;

    // Check if user's email is on the access list (admins always pass)
    if (user && user.email) {
        const { data: isAdmin } = await event.locals.supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!isAdmin) {
            const { data: access } = await event.locals.supabase
                .from('user_invites')
                .select('email')
                .eq('email', user.email)
                .maybeSingle();

            if (!access) {
                await event.locals.supabase.auth.signOut();
                throw redirect(303, '/?no_access=1');
            }
        }
    }

	// Protect dashboard and admin routes
	if (event.url.pathname.startsWith('/dashboard') || event.url.pathname.startsWith('/admin')) {
		if (!user) {
			throw redirect(303, '/login');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
		transformPageChunk: ({ html }) => {
			return html.replace('%sveltekit.head%', `%sveltekit.head%<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">`);
		}
	}).then((response) => {
		Object.entries(securityHeaders).forEach(([key, value]) => {
			response.headers.set(key, value);
		});
		response.headers.set('content-security-policy', cspByPath());
		return response;
	});
};
