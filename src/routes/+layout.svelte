<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { Toaster, toast } from 'svelte-sonner';
	
	let { data, children } = $props();
	let { supabase, session } = $derived(data);

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		const { data: authData } = supabase.auth.onAuthStateChange((event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		const params = $page.url.searchParams;
		if (params.get('signout') === 'success') {
			toast.success('You have been signed out.');
		} else if (params.get('no_access') === '1') {
			toast.error('You don\'t have access. Ask the owner for an invite.');
		}

		if (params.has('signout') || params.has('no_access')) {
			const url = new URL(window.location.href);
			url.searchParams.delete('signout');
			url.searchParams.delete('no_access');
			window.history.replaceState({}, '', url.toString());
		}

		return () => authData.subscription.unsubscribe();
	});

	let isDashboard = $derived($page.url.pathname.startsWith('/dashboard'));
	let isAdmin = $derived($page.url.pathname.startsWith('/admin'));
	let isLogin = $derived($page.url.pathname.startsWith('/login'));
</script>

<Toaster theme="dark" richColors position="top-right" />

<div class="min-h-screen flex flex-col relative z-10 selection:bg-amber-500/30 selection:text-amber-200">
	{#if !isDashboard && !isAdmin && !isLogin}
		<header class="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
			<div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
				<a href="/" class="text-2xl font-bold font-display tracking-tight text-zinc-100 flex items-center gap-2">
					<div class="w-6 h-6 bg-amber-500 rounded-sm rotate-3"></div>
					Forma
				</a>
				<div class="flex items-center space-x-6 text-sm font-medium text-zinc-400">
					{#if session}
						<a href="/dashboard" class="hover:text-zinc-100 transition-colors">Workspace</a>
						<a href="/admin" class="hover:text-zinc-100 transition-colors">Admin</a>
					{:else}
						<a href="/login" class="hover:text-zinc-100 transition-colors">Sign In</a>
					{/if}
				</div>
			</div>
		</header>
	{/if}

	<main class="flex-1 flex flex-col w-full h-full {isDashboard ? '' : 'max-w-7xl mx-auto px-6 py-12'}">
		{@render children()}
	</main>

	{#if !isDashboard && !isAdmin && !isLogin}
		<footer class="flex-shrink-0 relative z-10 border-t border-zinc-800/50 bg-zinc-950">
			<div class="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
				Made with ❤️ by <a href="https://github.com/mihirgrand" target="_blank" rel="noopener noreferrer" class="text-zinc-400 hover:text-zinc-200 transition-colors">Mihir</a>
			</div>
		</footer>
	{/if}
</div>
