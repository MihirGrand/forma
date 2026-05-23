<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import Grainient from '$lib/components/Grainient.svelte';
	import { fade } from 'svelte/transition';
	
	let { data } = $props();
	let session = $derived(data.session);
</script>

<Grainient />

<div class="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-12" in:fade={{duration: 500}}>
	<div class="space-y-6">
		<div class="inline-flex items-center px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm font-medium text-amber-500 mb-4">
			<span class="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
			Invite Only Beta
		</div>
		<h1 class="text-5xl sm:text-7xl font-display font-bold tracking-tight text-zinc-100 leading-[1.1]">
			The darkroom for <br/> <span class="text-zinc-500">modern designers.</span>
		</h1>
		<p class="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
			A brutally minimal workspace to host, organize, and preview your interface designs, stock assets, and custom typography.
		</p>
	</div>

	<div class="flex items-center justify-center gap-4">
		{#if session}
			<a href="/dashboard" class="group flex items-center gap-2 px-8 py-4 bg-zinc-100 text-zinc-950 hover:bg-white text-base font-semibold rounded-lg transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] cursor-pointer">
				Enter Workspace
				<ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
			</a>
		{:else}
			<a href="/login" class="group flex items-center gap-2 px-8 py-4 bg-amber-500 text-zinc-950 hover:bg-orange-600 text-base font-semibold rounded-lg transition-all shadow-[0_0_40px_-10px_rgba(255,90,31,0.4)] cursor-pointer">
				Get Started
				<ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
			</a>
		{/if}
	</div>
</div>

<div class="relative z-10 mt-32 grid sm:grid-cols-3 gap-8 border-t border-zinc-800/50 pt-16 text-left" in:fade={{duration: 500, delay: 200}}>
	<div class="space-y-3">
		<div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 mb-6">01</div>
		<h3 class="text-lg font-semibold font-display text-zinc-100">Visual Masonry</h3>
		<p class="text-zinc-500 text-sm leading-relaxed">Ditch the filenames. Experience your UI mockups and stock photos edge-to-edge in a distraction-free grid.</p>
	</div>
	<div class="space-y-3">
		<div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 mb-6">02</div>
		<h3 class="text-lg font-semibold font-display text-zinc-100">Live Typography</h3>
		<p class="text-zinc-500 text-sm leading-relaxed">Upload .woff files and instantly preview them rendered in the browser. Stop guessing how fonts look.</p>
	</div>
	<div class="space-y-3">
		<div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 mb-6">03</div>
		<h3 class="text-lg font-semibold font-display text-zinc-100">Lightning Tags</h3>
		<p class="text-zinc-500 text-sm leading-relaxed">A custom-built tagging engine. Find the exact asset you need in milliseconds, filtered by category and tags.</p>
	</div>
</div>
