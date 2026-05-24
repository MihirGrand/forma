<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import { ImageIcon, Type, LayoutGrid, Rows3, Maximize2, List } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import UploadModal from '$lib/components/UploadModal.svelte';
	import FontPreview from '$lib/components/FontPreview.svelte';
	import GalleryModal from '$lib/components/GalleryModal.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data } = $props();

	let files = $derived(data.files);
	let currentType = $derived(data.currentType);
	let availableTags = $derived(data.availableTags);
	let settings = $derived(data.settings);
	let user = $derived(data.user);
	let supabase = $derived(data.supabase);

	let showUploadModal = $state(false);
	let selectedFileIndex = $state(-1);
	let searchQuery = $state('');
	let currentTags = $state<string[]>([]);
	let sortOrder = $state('newest'); // newest, oldest, name
	let groupByTag = $state(false);
	let gridSize = $state('large'); // list, small, large, larger
	let previewText = $state('The quick brown fox jumps over the lazy dog');
    let previewSize = $state(32);
	let previewWeight = $state(400);

	const previewSizes = [24, 32, 40, 48, 56, 64, 72];
	const previewWeights = [200, 300, 400, 500, 600, 700, 800, 900];

	import { onMount } from 'svelte';

	onMount(() => {
		if ($page.url.searchParams.get('login') === 'success') {
			toast.success('Welcome back to the workspace.');
			// Remove the query param without reloading
			const url = new URL(window.location.href);
			url.searchParams.delete('login');
			window.history.replaceState({}, '', url.toString());
		}
	});

	// Handle URL params for tags if any
	$effect(() => {
		const tagParam = $page.url.searchParams.get('tag');
		if (tagParam && !currentTags.includes(tagParam)) {
			currentTags = [tagParam];
		}
	});

	// Filter only (no sort) - used as base for grouping
	let filteredBase = $derived(() => {
		let f = [...files];
		if (currentTags.length > 0) {
			f = f.filter(file => currentTags.every(t => file.tags.includes(t)));
		}
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			f = f.filter(file => file.file_name.toLowerCase().includes(q));
		}
		return f;
	});

	// Sorted flat list for ungrouped view / gallery
	let filteredFiles = $derived(() => {
		let f = filteredBase();
		if (sortOrder === 'newest') f.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		else if (sortOrder === 'oldest') f.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
		else if (sortOrder === 'name') f.sort((a, b) => a.file_name.localeCompare(b.file_name));
		else if (sortOrder === 'tag') {
			f.sort((a, b) => {
				const tagA = a.tags.length > 0 ? a.tags[0] : 'zzz';
				const tagB = b.tags.length > 0 ? b.tags[0] : 'zzz';
				return tagA.localeCompare(tagB) || a.file_name.localeCompare(b.file_name);
			});
		}
		return f;
	});

	// Grouped files: sort TAG GROUPS by sortOrder, not files within
	let groupedFiles = $derived(() => {
		if (!groupByTag) return null;
		const groups: Record<string, typeof files> = {};
		for (const file of filteredBase()) {
			if (file.tags.length === 0) {
				if (!groups['Untagged']) groups['Untagged'] = [];
				groups['Untagged'].push(file);
			} else {
				for (const tag of file.tags) {
					if (!groups[tag]) groups[tag] = [];
					groups[tag].push(file);
				}
			}
		}
		const keys = Object.keys(groups);
		if (sortOrder === 'newest') {
			keys.sort((a, b) => {
				const aLatest = Math.max(...groups[a].map(f => new Date(f.created_at).getTime()));
				const bLatest = Math.max(...groups[b].map(f => new Date(f.created_at).getTime()));
				return bLatest - aLatest;
			});
		} else if (sortOrder === 'oldest') {
			keys.sort((a, b) => {
				const aEarliest = Math.min(...groups[a].map(f => new Date(f.created_at).getTime()));
				const bEarliest = Math.min(...groups[b].map(f => new Date(f.created_at).getTime()));
				return aEarliest - bEarliest;
			});
		} else {
			keys.sort();
		}
		return keys.map(k => ({ tag: k, files: groups[k] }));
	});

	let gridClass = $derived(
		gridSize === 'small' ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' :
		gridSize === 'large' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
		'grid-cols-1 sm:grid-cols-2'
	);

	function getFontDisplayName(fileName: string) {
		return fileName
			.replace(/\.(woff2?|ttf|otf)$/i, '')
			.replace(/\b(variablefont|vf)\b/gi, '')
			.replace(/\b(wght|wdth|opsz|ital|slnt)\b/gi, '')
			.replace(/\b\d{2,4}\b/g, '')
			.replace(/[_-]+/g, ' ')
			.replace(/\s{2,}/g, ' ')
			.trim();
	}

	function handleUploadSuccess() {
		showUploadModal = false;
		invalidateAll();
	}
</script>

<div class="fixed inset-0 flex bg-zinc-950 overflow-hidden">
	<Sidebar
		{supabase}
		{currentType}
		{availableTags}
		{currentTags}
		{searchQuery}
		{sortOrder}
		{groupByTag}
		onSearchInput={(v: string) => searchQuery = v}
		onSortChange={(v: string) => sortOrder = v}
		onGroupChange={(v: boolean) => groupByTag = v}
		onAddTag={(t: string) => currentTags = [...currentTags, t]}
		onRemoveTag={(t: string) => currentTags = currentTags.filter((tag: string) => tag !== t)}
		onUploadClick={() => showUploadModal = true}
	/>

	<main class="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 relative">
		{#if $navigating}
			<div class="absolute top-0 left-0 right-0 h-1 overflow-hidden z-20">
				<div class="loader-bar h-full bg-amber-500/80"></div>
			</div>
		{/if}
		<!-- Top Bar -->
		<div class="min-h-16 border-b border-zinc-800/50 flex items-center justify-between px-8 py-3 flex-shrink-0 gap-6">
			<h2 class="text-lg font-medium text-zinc-100 capitalize font-display whitespace-nowrap">
				{currentType.replace('_', ' ')}s
			</h2>

			{#if currentType === 'font'}
				<div class="flex-1 flex items-center gap-3">
					<input
						type="text"
						bind:value={previewText}
						placeholder="Type to preview"
						class="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
					/>
					<div class="flex items-center gap-2">
						<select
							bind:value={previewSize}
							class="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
						>
							{#each previewSizes as size}
								<option value={size}>{size}px</option>
							{/each}
						</select>
						<select
							bind:value={previewWeight}
							class="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
						>
							{#each previewWeights as weight}
								<option value={weight}>{weight}</option>
							{/each}
						</select>
					</div>
				</div>
			{/if}

			<!-- Grid Size Toggle -->
			<div class="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
				{#if currentType === 'font'}
					<button onclick={() => gridSize = 'list'} class="p-1.5 rounded-md cursor-pointer text-zinc-400 hover:text-zinc-100 {gridSize === 'list' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : ''} transition-all" title="List view">
						<List size={16} />
					</button>
				{/if}
				<button onclick={() => gridSize = 'small'} class="p-1.5 rounded-md cursor-pointer text-zinc-400 hover:text-zinc-100 {gridSize === 'small' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : ''} transition-all" title="Small thumbnails">
					<LayoutGrid size={16} />
				</button>
				<button onclick={() => gridSize = 'large'} class="p-1.5 rounded-md cursor-pointer text-zinc-400 hover:text-zinc-100 {gridSize === 'large' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : ''} transition-all" title="Medium thumbnails">
					<Rows3 size={16} />
				</button>
				<button onclick={() => gridSize = 'larger'} class="p-1.5 rounded-md cursor-pointer text-zinc-400 hover:text-zinc-100 {gridSize === 'larger' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : ''} transition-all" title="Large thumbnails">
					<Maximize2 size={16} />
				</button>
			</div>
		</div>

		<!-- Masonry/Grid Canvas -->
		<div class="flex-1 overflow-y-auto p-8 pb-32">
			{#key currentType}
				<div in:fade={{ duration: 300, delay: 100 }} out:fade={{ duration: 150 }} class="h-full">
					{#if currentType === 'font'}
						<div class="flex items-center gap-2 mb-6">
							<div class="text-xs uppercase tracking-wider text-zinc-500">Previewing</div>
							<div class="text-sm text-zinc-300 truncate">"{previewText}"</div>
							<div class="text-xs text-zinc-500">{previewSize}px</div>
							<div class="text-xs text-zinc-500">{previewWeight}</div>
						</div>
					{/if}
					{#if groupByTag}
						<div class="space-y-12">
							{#each groupedFiles() || [] as group}
								<div>
									<h3 class="text-zinc-100 font-display text-xl font-semibold mb-4 px-2 flex items-center gap-2">
										<span class="w-2 h-2 rounded-full bg-amber-500"></span>
										{group.tag}
									</h3>
									<div class="grid {gridClass} gap-6 auto-rows-max">
										{#each group.files as file}
											{@const fIndex = filteredFiles().findIndex(f => f.id === file.id)}
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="group relative bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800/50 hover:border-amber-500/50 transition-all cursor-pointer aspect-[4/3] flex items-center justify-center"
												onclick={() => selectedFileIndex = fIndex}
											>
							{#if file.type === 'font'}
								<div class="w-full h-full text-zinc-100 p-2 pb-1">
									<FontPreview
										url={file.url}
										name={getFontDisplayName(file.file_name)}
										text={previewText}
										size={previewSize}
										weight={previewWeight}
									/>
								</div>
												{:else}
													<img src={file.url} alt="" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
												{/if}

												<!-- Hover Overlay -->
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-4">
								<div class="text-sm font-medium text-white truncate drop-shadow-md mb-1">{file.type === 'font' ? getFontDisplayName(file.file_name) : file.file_name}</div>
													<div class="flex flex-wrap gap-1">
														{#each file.tags as tag}
															<span class="text-[10px] uppercase tracking-wider bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">{tag}</span>
														{/each}
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{:else}
								<div class="h-full flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl py-12">
									<ImageIcon size={32} class="mb-4 opacity-50" />
									<p>No assets found.</p>
								</div>
							{/each}
						</div>
					{:else}
						{#if currentType === 'font' && gridSize === 'list'}
							<div class="space-y-4">
								{#each filteredFiles() as file, i (file.id)}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div class="bg-zinc-900/40 border border-zinc-800/60 rounded-xl px-4 py-4 flex items-center gap-6 cursor-pointer hover:border-amber-500/50 transition-all h-28" onclick={() => selectedFileIndex = i}>
										<div class="w-48 flex-shrink-0 flex flex-col justify-center">
											<div class="text-sm font-medium text-zinc-100 truncate mb-2">{getFontDisplayName(file.file_name)}</div>
											<div class="flex flex-wrap gap-1">
												{#each file.tags as tag}
													<span class="text-[10px] uppercase tracking-wider bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">{tag}</span>
												{:else}
													<span class="text-xs text-zinc-500">No tags</span>
												{/each}
											</div>
										</div>
										<div class="flex-1 min-w-0 h-full">
											<FontPreview
												url={file.url}
												name={null}
												text={previewText}
												size={previewSize}
												weight={previewWeight}
												truncateText={true}
											/>
										</div>
									</div>
								{:else}
									<div class="text-sm text-zinc-500">No fonts found.</div>
								{/each}
							</div>
						{:else}
							<div class="grid {gridClass} gap-6 auto-rows-max">
								{#each filteredFiles() as file, i (file.id)}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class="group relative bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800/50 hover:border-amber-500/50 transition-all cursor-pointer aspect-[4/3] flex items-center justify-center"
										onclick={() => selectedFileIndex = i}
									>
									{#if file.type === 'font'}
										<div class="w-full h-full text-zinc-100 p-2 pb-1">
											<FontPreview
												url={file.url}
												name={getFontDisplayName(file.file_name)}
												text={previewText}
												size={previewSize}
												weight={previewWeight}
											/>
										</div>
									{:else}
										<img src={file.url} alt="" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
									{/if}

									<!-- Hover Overlay -->
									<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-4">
										<div class="text-sm font-medium text-white truncate drop-shadow-md mb-1">{file.type === 'font' ? getFontDisplayName(file.file_name) : file.file_name}</div>
										<div class="flex flex-wrap gap-1">
											{#each file.tags as tag}
												<span class="text-[10px] uppercase tracking-wider bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">{tag}</span>
											{/each}
										</div>
									</div>
									</div>
								{:else}
									<div class="col-span-full h-64 flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl">
										<ImageIcon size={32} class="mb-4 opacity-50" />
										<p>No assets found.</p>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/key}
		</div>
	</main>

	<footer class="sticky bottom-0 left-0 right-0 border-t border-zinc-800/50 px-8 py-4 text-center text-sm text-zinc-500 bg-zinc-900/95 backdrop-blur">
		Made with ❤️ by <a href="https://github.com/mihirgrand" target="_blank" rel="noopener noreferrer" class="text-zinc-400 hover:text-zinc-200 transition-colors">Mihir</a> | Icons by <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" class="text-zinc-400 hover:text-zinc-200 transition-colors">Icons8</a>
	</footer>
</div>

{#if showUploadModal}
	<UploadModal {supabase} {user} {settings} {availableTags} onClose={() => showUploadModal = false} onSuccess={handleUploadSuccess} />
{/if}

{#if selectedFileIndex !== -1}
					<GalleryModal
						files={filteredFiles()}
						currentIndex={selectedFileIndex}
						{supabase}
						previewText={previewText}
						onClose={() => selectedFileIndex = -1}
						onUpdate={invalidateAll}
						onChangeIndex={(idx: number) => selectedFileIndex = idx}
						/>
{/if}

<style>
	.loader-bar {
		transform: translateX(-100%);
		animation: loader-bar 1.2s ease-in-out infinite;
	}

	@keyframes loader-bar {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(100%);
		}
	}
</style>
