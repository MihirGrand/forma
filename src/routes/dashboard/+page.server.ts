import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals: { supabase, user }, url }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const type = url.searchParams.get('type') || 'ui_design';
	const tag = url.searchParams.get('tag');

	let query = supabase
		.from('files')
		.select('*')
		.eq('type', type)
		.order('created_at', { ascending: false });

	if (tag) {
		query = query.contains('tags', [tag]);
	}

	const { data: files, error: filesError } = await query;
	if (filesError) {
		error(403, 'Forbidden');
	}

	// Fetch all unique tags for this type
	const { data: allFiles, error: tagsError } = await supabase.from('files').select('tags').eq('type', type);
	if (tagsError) {
		error(403, 'Forbidden');
	}
	const tagsSet = new Set<string>();
	allFiles?.forEach(f => {
		if (f.tags) {
			f.tags.forEach((t: string) => tagsSet.add(t));
		}
	});

	const { data: settings, error: settingsError } = await supabase.from('site_settings').select('max_image_size, max_font_size').single();
	if (settingsError) {
		error(403, 'Forbidden');
	}

	return {
		files: files || [],
		currentType: type,
		currentTag: tag,
		availableTags: Array.from(tagsSet),
		settings: settings || { max_image_size: 0, max_font_size: 0 }
	};
};
