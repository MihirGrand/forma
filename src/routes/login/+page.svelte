<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Grainient from '$lib/components/Grainient.svelte';
	import { fade } from 'svelte/transition';
	
	let { data } = $props();
	let supabase = $derived(data.supabase);

	let loading = $state(false);
	let error = $state('');

	onMount(() => {
		const errParam = $page.url.searchParams.get('error');
		if (errParam) error = errParam;
	});

	async function loginWithGoogle() {
		try {
			loading = true;
			error = '';
			const { error: err } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/auth/callback`
				}
			});
			if (err) throw err;
		} catch (err: any) {
			error = err.message || 'Error authenticating.';
		} finally {
			loading = false;
		}
	}
</script>

<Grainient />

<div class="fixed inset-0 flex z-50 pointer-events-none">
	<!-- Left Side: Atmospheric abstract / branding -->
	<div class="hidden lg:flex w-1/2 relative border-r border-zinc-800/50 flex-col justify-between p-12 overflow-hidden pointer-events-auto" in:fade={{duration: 400}}>
		
		<div class="relative z-10">
			<a href="/" class="text-3xl font-bold font-display tracking-tight text-zinc-100 flex items-center gap-3 w-max">
				<div class="w-8 h-8 bg-amber-500 rounded-sm rotate-3"></div>
				Forma
			</a>
		</div>

		<div class="relative z-10 max-w-md">
			<h2 class="text-4xl font-display font-medium text-zinc-100 leading-tight">
				Your creative assets, <br/> meticulously organized.
			</h2>
			<p class="mt-4 text-zinc-500 text-lg">
				Join the invite-only beta to access the studio workspace.
			</p>
		</div>
	</div>

	<!-- Right Side: Login Panel -->
	<div class="w-full lg:w-1/2 flex items-center justify-center p-8 relative pointer-events-auto bg-zinc-950/80 backdrop-blur-md" in:fade={{duration: 400, delay: 100}}>
		<!-- Mobile Logo -->
		<a href="/" class="absolute top-8 left-8 lg:hidden text-2xl font-bold font-display tracking-tight text-zinc-100 flex items-center gap-2">
			<div class="w-6 h-6 bg-amber-500 rounded-sm rotate-3"></div>
			Forma
		</a>

		<div class="w-full max-w-sm space-y-8">
			<div>
				<h1 class="text-2xl font-display font-semibold text-zinc-100">Welcome back</h1>
				<p class="text-zinc-500 mt-2 text-sm">Sign in or create an account to continue.</p>
			</div>

			{#if error}
				<div class="p-4 bg-red-950/50 border border-red-900/50 text-red-400 text-sm rounded-lg flex items-start gap-3">
					<div class="mt-0.5">•</div>
					<div>{error}</div>
				</div>
			{/if}

			<button
				class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-zinc-800 rounded-lg shadow-sm bg-zinc-900/50 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				onclick={loginWithGoogle}
				disabled={loading}
			>
				{#if loading}
					<span class="w-5 h-5 border-2 border-zinc-500 border-t-zinc-100 rounded-full animate-spin"></span>
					Authenticating...
				{:else}
					<svg class="w-5 h-5" viewBox="0 0 24 24">
						<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
					</svg>
					Continue with Google
				{/if}
			</button>
			
			<div class="text-center text-xs text-zinc-600 mt-8">
				By continuing, you agree to our Terms of Service.
			</div>
		</div>
	</div>
</div>
