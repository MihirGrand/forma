import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/dashboard';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			const separator = next.includes('?') ? '&' : '?';
			throw redirect(303, `${next}${separator}login=success`);
		}
		console.error('Error exchanging code for session:', error);
	}

	// If exchange fails, redirect to login page with an error
	throw redirect(303, '/login?error=Could not exchange auth code');
};
