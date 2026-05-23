<script lang="ts">
	import { page } from '$app/stores';
	import { Plus, Image as ImageIcon, Type, Search, Settings, LogOut, X } from '@lucide/svelte';
	
	let { supabase, currentType, availableTags = [], currentTags = [], searchQuery = '', sortOrder = '', groupByTag = false, onSearchInput, onSortChange, onGroupChange, onAddTag, onRemoveTag, onUploadClick, isAdminPage = false } = $props();

	function updateUrlParams(updates: Record<string, string | null>) {
		const url = new URL($page.url);
		for (const [key, value] of Object.entries(updates)) {
			if (value === null) url.searchParams.delete(key);
			else url.searchParams.set(key, value);
		}
		return url.toString();
	}

	let tagInputValue = $state(searchQuery);

	$effect(() => {
		tagInputValue = searchQuery;
	});

	let tagSuggestions = $derived(() => {
		if (!tagInputValue) return [];
		return availableTags.filter(
			(t: string) => t.toLowerCase().includes(tagInputValue.toLowerCase()) && !currentTags.includes(t)
		);
	});

	function addTagFromSuggestion(tag: string) {
		onAddTag(tag);
		tagInputValue = '';
		onSearchInput('');
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const val = tagInputValue.trim().toLowerCase();
			if (val && availableTags.includes(val) && !currentTags.includes(val)) {
				addTagFromSuggestion(val);
			} else {
				onSearchInput(tagInputValue);
			}
		}
	}

	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		tagInputValue = val;
		onSearchInput(val);
	}

	let showSignOutConfirm = $state(false);

	async function handleSignOut() {
		showSignOutConfirm = false;
		await supabase.auth.signOut();
		window.location.href = '/?signout=success';
	}
</script>

<aside class="w-72 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950 flex flex-col h-full overflow-y-auto z-10">
	<!-- Header / Logo -->
	<div class="h-16 px-6 flex items-center border-b border-zinc-800/50 flex-shrink-0">
		<a href="/" class="text-xl font-bold font-display tracking-tight text-zinc-100 flex items-center gap-2">
			<div class="w-5 h-5 bg-amber-500 rounded-sm rotate-3"></div>
			Forma
		</a>
	</div>

	<!-- Upload Button -->
	<div class="p-6">
		<button
			onclick={onUploadClick}
			class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-zinc-950 font-semibold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
		>
			<Plus size={18} />
			Upload Asset
		</button>
	</div>

	<!-- Navigation -->
	<nav class="px-3 space-y-1">
		<a
			href="/dashboard?type=ui_design"
			class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {!isAdminPage && currentType === 'ui_design' ? 'bg-zinc-800/50 text-amber-500' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}"
		>
			<ImageIcon size={18} />
			UI Design
		</a>
		<a
			href="/dashboard?type=stock_image"
			class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {!isAdminPage && currentType === 'stock_image' ? 'bg-zinc-800/50 text-amber-500' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}"
		>
			<ImageIcon size={18} />
			Stock Images
		</a>
		<a
			href="/dashboard?type=font"
			class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {!isAdminPage && currentType === 'font' ? 'bg-zinc-800/50 text-amber-500' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}"
		>
			<Type size={18} />
			Fonts
		</a>
	</nav>

	<!-- Filters Section (Only show on dashboard) -->
	{#if !isAdminPage}
		<div class="mt-8 px-6 flex-1 flex flex-col">
			<h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Filters & Tools</h3>
			
			<div class="space-y-4">
				<!-- Search / Tags Hybrid -->
				<div class="relative bg-zinc-900 border border-zinc-800 rounded-md focus-within:border-amber-500 transition-colors px-2 py-1 flex flex-wrap gap-1.5 min-h-[38px] items-center">
					<Search size={14} class="text-zinc-500 ml-1" />
					
					{#each currentTags as tag}
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
							{tag}
							<button type="button" class="hover:text-amber-400 cursor-pointer" onclick={() => onRemoveTag(tag)}><X size={12} /></button>
						</span>
					{/each}

					<input 
						type="text" 
						value={tagInputValue}
						oninput={handleSearchInput}
						onkeydown={handleSearchKeydown}
						placeholder={currentTags.length === 0 ? "Search or add tags..." : ""}
						class="flex-1 bg-transparent border-none min-w-[100px] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
					/>

					{#if tagSuggestions().length > 0}
						<div class="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-40 overflow-y-auto">
							{#each tagSuggestions() as tag}
								<button 
									type="button"
									class="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer transition-colors"
									onclick={() => addTagFromSuggestion(tag)}
								>
									{tag}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Sort -->
				<div class="relative">
					<select value={sortOrder} onchange={(e) => onSortChange(e.currentTarget.value)} class="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer">
						<option value="newest">Sort: Newest first</option>
						<option value="oldest">Sort: Oldest first</option>
						<option value="name">Sort: A-Z</option>
						<option value="tag">Sort: By Tag</option>
					</select>
					<div class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
					</div>
				</div>

				<!-- Group By Toggle -->
				<label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer w-max">
					<input 
						type="checkbox" 
						checked={groupByTag} 
						onchange={(e) => onGroupChange(e.currentTarget.checked)}
						class="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer" 
					/>
					Group by Tag
				</label>
			</div>
		</div>
	{:else}
		<div class="mt-8 px-6 flex-1 flex flex-col"></div>
	{/if}
	
	<div class="p-3 border-t border-zinc-800/50 mt-auto space-y-1">
		<a href="/admin" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isAdminPage ? 'bg-zinc-800/50 text-amber-500' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}">
			<Settings size={18} />
			Admin Settings
		</a>
		<button onclick={() => showSignOutConfirm = true} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
			<LogOut size={18} />
			Sign Out
		</button>
	</div>
</aside>

{#if showSignOutConfirm}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onclick={() => showSignOutConfirm = false}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-zinc-100 mb-2">Sign out</h3>
			<p class="text-sm text-zinc-400 mb-6">Are you sure you want to sign out?</p>
			<div class="flex gap-3 justify-end">
				<button 
					onclick={() => showSignOutConfirm = false} 
					class="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
				>
					Cancel
				</button>
				<button 
					onclick={handleSignOut} 
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
				>
					Sign out
				</button>
			</div>
		</div>
	</div>
{/if}
