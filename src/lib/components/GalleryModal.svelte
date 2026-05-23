<script lang="ts">
	import { X, Trash2, Edit2, Info, Download, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { fade, scale } from 'svelte/transition';
	
	let { files, currentIndex, supabase, onClose, onUpdate, onChangeIndex, previewText = 'The quick brown fox jumps over the lazy dog' } = $props();
	
	let file = $derived(files[currentIndex]);
	let previewLine = $derived(previewText);
	let fontFamily = $state('');
	let fontReady = $state(false);

	let isEditing = $state(false);
	let newName = $state('');
	let newTags = $state('');
	
	$effect(() => {
		if (file) {
			newName = file.file_name;
			newTags = file.tags ? file.tags.join(', ') : '';
			isEditing = false;
		}
	});

	$effect(() => {
		if (!file || file.type !== 'font') {
			fontFamily = '';
			fontReady = false;
			return;
		}
		const nextFamily = `preview-${file.id}-${Date.now()}`;
		fontFamily = nextFamily;
		fontReady = false;
		const font = new FontFace(nextFamily, `url(${file.url})`);
		font
			.load()
			.then(() => {
				document.fonts.add(font);
				fontReady = true;
			})
			.catch(() => {
				fontReady = false;
			});
	});

	let isSaving = $state(false);
	let isDeleting = $state(false);
	let confirmDelete = $state(false);
	let showFilmstrip = $state(true);

	async function saveChanges() {
		isSaving = true;
		const tagsArray = newTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
		
		const { error } = await supabase
			.from('files')
			.update({ file_name: newName, tags: tagsArray })
			.eq('id', file.id);
			
		isSaving = false;
		if (!error) {
			isEditing = false;
			onUpdate();
		}
	}

	async function deleteFile() {
		isDeleting = true;
		try {
			const urlObj = new URL(file.url);
			const pathSegments = urlObj.pathname.split('/');
			const filePath = pathSegments.slice(pathSegments.indexOf('files') + 1).join('/');
			
			await supabase.storage.from('files').remove([filePath]);
			await supabase.from('files').delete().eq('id', file.id);
			
			onUpdate();
			if (files.length <= 1) {
				onClose();
			} else {
				if (currentIndex >= files.length - 1) {
					onChangeIndex(currentIndex - 1);
				}
			}
		} catch (e) {
			console.error("Delete failed", e);
		} finally {
			isDeleting = false;
			confirmDelete = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	}

	function formatBytes(bytes: number) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function next() {
		if (currentIndex < files.length - 1) onChangeIndex(currentIndex + 1);
	}
	function prev() {
		if (currentIndex > 0) onChangeIndex(currentIndex - 1);
	}

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
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-[100] flex bg-zinc-950/80 backdrop-blur-md" in:fade={{duration: 200}} out:fade={{duration: 150}} onclick={onClose}>

	<!-- Top Bar -->
	<div class="absolute top-0 inset-x-0 h-16 flex items-center justify-end px-6 pointer-events-none z-20" onclick={(e) => e.stopPropagation()}>
		<button onclick={onClose} class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors pointer-events-auto cursor-pointer">
			<X size={20} />
		</button>
	</div>

	<!-- Navigation Arrows -->
	<div class="absolute inset-y-0 left-4 flex items-center z-10 pointer-events-none" onclick={(e) => e.stopPropagation()}>
		{#if currentIndex > 0}
			<button onclick={prev} class="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors pointer-events-auto cursor-pointer">
				<ChevronLeft size={24} />
			</button>
		{/if}
	</div>
	
	<!-- Right Panel is w-80, so we adjust right arrow position -->
	<div class="absolute inset-y-0 right-[340px] flex items-center z-10 pointer-events-none" onclick={(e) => e.stopPropagation()}>
		{#if currentIndex < files.length - 1}
			<button onclick={next} class="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors pointer-events-auto cursor-pointer">
				<ChevronRight size={24} />
			</button>
		{/if}
	</div>

	<!-- Image/Preview Area -->
	<div class="flex-1 flex flex-col items-center justify-center p-12 overflow-hidden relative z-10 pointer-events-none" onclick={(e) => e.stopPropagation()}>
		<div class="flex-1 w-full flex items-center justify-center min-h-0" onclick={(e) => e.stopPropagation()}>
			{#key file.id}
					<div class="pointer-events-auto">
						{#if file.type === 'font'}
							<div class="w-full max-w-4xl p-12 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center space-y-6" in:scale={{start: 0.95, duration: 300}}>
								<div class="text-zinc-400 text-sm">{getFontDisplayName(file.file_name)}</div>
								{#if fontReady}
									<div class="w-full space-y-4" style={`font-family: '${fontFamily}'`}>
										<div class="text-zinc-100 text-center" style="font-size: 64px; font-weight: 700;">{previewLine}</div>
										<div class="text-zinc-100 text-center" style="font-size: 48px; font-weight: 500;">{previewLine}</div>
										<div class="text-zinc-300 text-center" style="font-size: 36px; font-weight: 400;">{previewLine}</div>
										<div class="text-zinc-400 text-center" style="font-size: 24px; font-weight: 300;">{previewLine}</div>
									</div>
								{:else}
									<div class="w-full space-y-4">
										<div class="h-8 bg-zinc-800/70 rounded animate-pulse"></div>
										<div class="h-6 bg-zinc-800/60 rounded animate-pulse"></div>
										<div class="h-5 bg-zinc-800/50 rounded animate-pulse"></div>
										<div class="h-4 bg-zinc-800/40 rounded animate-pulse"></div>
									</div>
								{/if}
							</div>
						{:else}
							<img src={file.url} alt={file.file_name} class="max-w-full max-h-full object-contain drop-shadow-[0_0_100px_rgba(255,255,255,0.02)]" in:scale={{start: 0.98, duration: 300}} />
						{/if}
					</div>
			{/key}
		</div>

		<!-- Toggleable Filmstrip -->
		<div class="mt-6 pointer-events-auto">
			<button onclick={() => showFilmstrip = !showFilmstrip} class="text-xs font-medium text-zinc-500 hover:text-zinc-300 mb-2 cursor-pointer">
				{showFilmstrip ? 'Hide filmstrip' : 'Show filmstrip'}
			</button>
			{#if showFilmstrip}
				<div class="flex items-center gap-2 max-w-3xl overflow-x-auto pb-2 custom-scrollbar p-2 bg-zinc-950/50 rounded-xl border border-zinc-800/50" in:fade>
					{#each files as f, i}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div 
							class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all {i === currentIndex ? 'border-amber-500 opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}"
							onclick={() => onChangeIndex(i)}
						>
							{#if f.type === 'font'}
								<div class="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-2xl font-serif">Ag</div>
							{:else}
								<img src={f.url} alt="" class="w-full h-full object-cover" />
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Info Panel -->
	<div class="w-80 border-l border-zinc-800/50 bg-zinc-950 flex flex-col shadow-2xl z-20" onclick={(e) => e.stopPropagation()}>
		<div class="p-6 border-b border-zinc-800/50 flex-shrink-0">
			<h3 class="text-sm font-semibold text-zinc-100 font-display">Asset Details</h3>
		</div>
		
		<div class="p-6 flex-1 overflow-y-auto space-y-8">
			{#if isEditing}
				<div class="space-y-4" in:fade>
					<div>
						<label class="block text-xs font-medium text-zinc-500 mb-1">File Name</label>
						<input type="text" bind:value={newName} class="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500" />
					</div>
					<div>
						<label class="block text-xs font-medium text-zinc-500 mb-1">Tags (comma separated)</label>
						<textarea bind:value={newTags} rows="3" class="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"></textarea>
					</div>
					<div class="flex gap-2">
						<button onclick={saveChanges} disabled={isSaving} class="flex-1 bg-amber-500 text-zinc-950 text-sm font-semibold py-2 rounded-md hover:bg-orange-600 transition-colors cursor-pointer">
							{isSaving ? 'Saving...' : 'Save'}
						</button>
						<button onclick={() => isEditing = false} class="px-4 bg-zinc-900 text-zinc-300 border border-zinc-800 text-sm font-medium rounded-md hover:text-white transition-colors cursor-pointer">
							Cancel
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-6" in:fade>
					<div>
						<div class="text-xs font-medium text-zinc-500 mb-1">Name</div>
						<div class="text-sm text-zinc-100 break-words">{getFontDisplayName(file.file_name)}</div>
					</div>
					
					<div>
						<div class="text-xs font-medium text-zinc-500 mb-2">Tags</div>
						<div class="flex flex-wrap gap-1.5">
							{#each file.tags as tag}
								<span class="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">{tag}</span>
							{:else}
								<span class="text-sm text-zinc-600">No tags.</span>
							{/each}
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
						<div>
							<div class="text-xs font-medium text-zinc-500 mb-1">Size</div>
							<div class="text-sm text-zinc-300">{formatBytes(file.file_size)}</div>
						</div>
						<div>
							<div class="text-xs font-medium text-zinc-500 mb-1">Uploaded</div>
							<div class="text-sm text-zinc-300">{new Date(file.created_at).toLocaleDateString()}</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="p-6 border-t border-zinc-800/50 space-y-3 bg-zinc-950">
			{#if !isEditing}
				<a href={file.url} download target="_blank" class="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 text-zinc-950 rounded-md text-sm font-semibold hover:bg-white transition-colors cursor-pointer">
					<Download size={16} />
					Download Original
				</a>
				<button onclick={() => isEditing = true} class="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md text-sm font-medium hover:text-white hover:border-zinc-700 transition-colors cursor-pointer">
					<Edit2 size={16} />
					Edit Details
				</button>
				
				{#if confirmDelete}
					<button onclick={deleteFile} disabled={isDeleting} class="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/50 text-red-500 rounded-md text-sm font-medium hover:bg-red-500 hover:text-white transition-all cursor-pointer">
						{isDeleting ? 'Deleting...' : 'Are you sure?'}
					</button>
				{:else}
					<button onclick={() => confirmDelete = true} class="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent border border-transparent text-zinc-500 rounded-md text-sm font-medium hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
						<Trash2 size={16} />
						Delete Asset
					</button>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		height: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: #3f3f46;
		border-radius: 10px;
	}
</style>
