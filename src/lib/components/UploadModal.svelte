<script lang="ts">
	import { UploadCloud, X, ChevronDown, Check } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	
	let { supabase, user, settings, availableTags = [], onClose, onSuccess } = $props();

	let file: File | null = $state(null);
	let type = $state('ui_design');
	let tags = $state<string[]>([]);
	let tagInputText = $state('');
	let loading = $state(false);
	let error = $state('');
	let isDragging = $state(false);
	let dropdownOpen = $state(false);

	let suggestedTags = $derived(
		tagInputText.length > 0 
		? availableTags.filter(t => t.includes(tagInputText.toLowerCase()) && !tags.includes(t)).slice(0, 5)
		: []
	);

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			file = target.files[0];
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			file = e.dataTransfer.files[0];
			// Auto detect type if possible
			if (file.name.endsWith('.woff') || file.name.endsWith('.woff2')) {
				type = 'font';
			}
		}
	}

	function handleTagInput(e: KeyboardEvent) {
		if (e.key === ',' || e.key === 'Enter') {
			e.preventDefault();
			addTag(tagInputText);
		} else if (e.key === 'Backspace' && tagInputText === '' && tags.length > 0) {
			tags.pop();
			tags = [...tags]; // trigger reactivity
		}
	}

	function addTag(tag: string) {
		const t = tag.trim().toLowerCase();
		if (t && !tags.includes(t)) {
			tags = [...tags, t];
		}
		tagInputText = '';
	}

	function removeTag(tag: string) {
		tags = tags.filter(t => t !== tag);
	}

	async function upload() {
		if (!file) return;
		loading = true;
		error = '';

		try {
			// Basic client side validation
			if (type === 'font') {
				if (!file.name.endsWith('.woff') && !file.name.endsWith('.woff2')) {
					throw new Error('Only .woff and .woff2 files are supported for fonts');
				}
				if (settings.max_font_size > 0 && file.size > settings.max_font_size) {
					throw new Error(`Font file size exceeds the maximum limit of ${Math.round(settings.max_font_size / 1024 / 1024)}MB`);
				}
			} else {
				if (settings.max_image_size > 0 && file.size > settings.max_image_size) {
					throw new Error(`Image file size exceeds the maximum limit of ${Math.round(settings.max_image_size / 1024 / 1024)}MB`);
				}
			}

			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
			const filePath = `${user.id}/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from('files')
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			const { data: { publicUrl } } = supabase.storage
				.from('files')
				.getPublicUrl(filePath);

			const { error: dbError } = await supabase
				.from('files')
				.insert({
					type,
					url: publicUrl,
					file_name: file.name,
					file_size: file.size,
					user_id: user.id,
					tags
				});

			if (dbError) throw dbError;
			onSuccess();
		} catch (err: any) {
			error = err.message || 'Error uploading file';
		} finally {
			loading = false;
		}
	}
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4" in:fade={{duration: 200}} out:fade={{duration: 150}}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div role="presentation" class="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onclick={onClose}></div>
	
	<div class="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-full" in:fly={{y: 20, duration: 300, delay: 50}}>
		<div class="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-950 sticky top-0 z-20">
			<h3 class="text-lg font-display font-medium text-zinc-100">Upload Asset</h3>
			<button onclick={onClose} class="text-zinc-500 hover:text-zinc-100 transition-colors">
				<X size={20} />
			</button>
		</div>
		
		<div class="p-6 space-y-6 overflow-y-auto">
			{#if error}
				<div class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg" in:fade>{error}</div>
			{/if}
			
			<!-- File Type Selector Custom -->
			<div class="relative">
				<label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Category</label>
				<button 
					type="button" 
					class="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 text-left text-sm text-zinc-100 focus:outline-none focus:border-amber-500 flex justify-between items-center transition-colors"
					onclick={() => dropdownOpen = !dropdownOpen}
				>
					<span>{type === 'ui_design' ? 'UI Design' : type === 'stock_image' ? 'Stock Image' : 'Typography (Font)'}</span>
					<ChevronDown size={16} class="text-zinc-500" />
				</button>
				
				{#if dropdownOpen}
					<div class="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-20" in:fly={{y: -5, duration: 150}} out:fade={{duration: 100}}>
						<button class="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-between" onclick={() => { type = 'ui_design'; dropdownOpen = false; }}>
							UI Design
							{#if type === 'ui_design'}<Check size={14} class="text-amber-500"/>{/if}
						</button>
						<button class="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-between" onclick={() => { type = 'stock_image'; dropdownOpen = false; }}>
							Stock Image
							{#if type === 'stock_image'}<Check size={14} class="text-amber-500"/>{/if}
						</button>
						<button class="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-between" onclick={() => { type = 'font'; dropdownOpen = false; }}>
							Typography (Font)
							{#if type === 'font'}<Check size={14} class="text-amber-500"/>{/if}
						</button>
					</div>
				{/if}
			</div>

			<!-- Dropzone -->
			<div>
				<label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">File</label>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div 
					class="relative flex justify-center px-6 pt-8 pb-10 border-2 border-dashed rounded-xl transition-all {isDragging ? 'border-amber-500 bg-amber-500/5' : file ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/50'}"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<div class="space-y-3 text-center">
						<UploadCloud class="mx-auto h-10 w-10 {isDragging ? 'text-amber-500' : file ? 'text-zinc-100' : 'text-zinc-600'} transition-colors" />
						
						{#if file}
							<div class="text-sm font-medium text-amber-500 truncate max-w-xs">{file.name}</div>
							<p class="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
						{:else}
							<div class="flex text-sm text-zinc-400 justify-center">
								<label for="file-upload" class="relative cursor-pointer rounded-md font-medium text-amber-500 hover:text-amber-400 focus-within:outline-none">
									<span>Click to browse</span>
									<input id="file-upload" name="file-upload" type="file" class="sr-only" onchange={handleFileChange} accept={type === 'font' ? '.woff,.woff2' : 'image/*'} />
								</label>
								<p class="pl-1">or drag and drop</p>
							</div>
							<p class="text-xs text-zinc-600">
								{type === 'font' ? 'WOFF or WOFF2' : 'PNG, JPG, SVG, GIF, WebP'}
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Tags -->
			<div>
				<label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tags</label>
				<div class="min-h-[46px] p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-wrap gap-1.5 focus-within:border-amber-500 transition-colors relative">
					{#each tags as tag}
						<span class="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-md text-sm">
							{tag}
							<button type="button" onclick={() => removeTag(tag)} class="hover:text-amber-400"><X size={12} /></button>
						</span>
					{/each}
					<input 
						type="text" 
						bind:value={tagInputText}
						onkeydown={handleTagInput}
						placeholder={tags.length === 0 ? "Type and press comma..." : ""} 
						class="flex-1 min-w-[120px] bg-transparent border-none text-sm text-zinc-100 focus:outline-none focus:ring-0 p-1.5"
					/>
					
					{#if suggestedTags.length > 0}
						<div class="absolute top-full left-0 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-lg overflow-hidden z-30">
							{#each suggestedTags as stag}
								<button 
									class="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700" 
									onclick={() => addTag(stag)}
								>
									{stag}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="px-6 py-5 border-t border-zinc-800/50 bg-zinc-950 flex justify-end gap-3 sticky bottom-0">
			<button onclick={onClose} class="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
			<button onclick={upload} disabled={!file || loading} class="px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-[0_0_20px_-5px_rgba(255,90,31,0.5)] cursor-pointer">
				{loading ? 'Uploading...' : 'Upload Asset'}
			</button>
		</div>
	</div>
</div>
