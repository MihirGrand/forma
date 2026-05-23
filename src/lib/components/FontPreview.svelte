<script lang="ts">
	import { onMount } from 'svelte';
	let { url, name, text = 'The quick brown fox jumps over the lazy dog', size = 48, weight = 400, truncateText = false } = $props();
	
	let fontLoaded = $state(false);
	let fontFamily = $state(`font-${Math.random().toString(36).substring(2, 10)}`);

	onMount(async () => {
		try {
			const font = new FontFace(fontFamily, `url(${url})`);
			await font.load();
			document.fonts.add(font);
			fontLoaded = true;
		} catch (e) {
			console.error("Failed to load font:", e);
		}
	});
</script>

<div class="h-full flex flex-col w-full">
	<div class="flex-1 w-full flex items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-amber-500/60 transition-colors">
		{#if fontLoaded}
			<p
				class="text-center text-zinc-100 {truncateText ? 'truncate whitespace-nowrap' : 'break-words'} w-full"
				style="font-family: '{fontFamily}'; font-size: {size}px; font-weight: {weight};"
			>
				{text}
			</p>
		{:else}
			<div class="animate-pulse flex space-x-4">
				<div class="h-4 bg-zinc-800 rounded w-3/4"></div>
			</div>
		{/if}
	</div>
	{#if name}
		<div class="mt-3 text-sm font-medium text-zinc-300 text-center break-words pb-1">{name}</div>
	{/if}
</div>
