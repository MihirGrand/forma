import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	// Check if admin
	const { data: adminCheck, error: adminError } = await supabase
		.from('admin_users')
		.select('*')
		.eq('user_id', user.id)
		.single();

	if (adminError) {
		error(403, 'Forbidden');
	}

	if (!adminCheck) {
		error(403, 'Forbidden - Admins only');
	}

	const { data: settings, error: settingsError } = await supabase
		.from('site_settings')
		.select('*')
		.single();

	if (settingsError) {
		error(403, 'Forbidden');
	}

	const { data: invites, error: invitesError } = await supabase
		.from('user_invites')
		.select('*')
		.order('created_at', { ascending: false });

	if (invitesError) {
		error(403, 'Forbidden');
	}

	return {
		settings: settings || { allow_new_registrations: false, max_image_size: 0, max_font_size: 0 },
		invites: invites || [],
		adminEmail: user.email
	};
};

export const actions: Actions = {
	updateSettings: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const allow_new_registrations = formData.get('allow_new_registrations') === 'on';
		const max_image_size = Number(formData.get('max_image_size')) || 0;
		const max_font_size = Number(formData.get('max_font_size')) || 0;

		const { error: err } = await supabase
			.from('site_settings')
			.update({ allow_new_registrations, max_image_size, max_font_size })
			.eq('id', '00000000-0000-0000-0000-000000000000');

		if (err) {
			return fail(500, { message: 'Failed to update settings' });
		}
		return { success: true };
	},

	createInvite: async ({ request, locals: { supabase, session } }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();

		if (!email) {
			return fail(400, { message: 'Email is required' });
		}

		// generate a random code
		const invite_code = Math.random().toString(36).substring(2, 10);

		const { error: err } = await supabase
			.from('user_invites')
			.insert({
				email,
				invite_code,
				created_by: session?.user.id
			});

		if (err) {
			return fail(500, { message: 'Failed to create invite' });
		}
		return { success: true };
	},

	deleteInvite: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return fail(400, { message: 'ID required' });

		const { error: err } = await supabase.from('user_invites').delete().eq('id', id);

		if (err) {
			return fail(500, { message: 'Failed to revoke access. ' + err.message });
		}
		return { success: true };
	}
};
