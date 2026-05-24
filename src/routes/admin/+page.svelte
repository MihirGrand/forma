<script lang="ts">
	import { enhance } from '$app/forms';
	import Sidebar from '$lib/components/Sidebar.svelte';
	let { data, form } = $props();
	
	let settings = $derived(data.settings);
	let invites = $derived(data.invites);
	let adminEmail = $derived(data.adminEmail);
	let supabase = $derived(data.supabase);
</script>

<div class="fixed inset-0 flex bg-zinc-950 overflow-hidden">
	<Sidebar 
		{supabase}
		currentType="ui_design"
		isAdminPage={true}
		onSearchInput={() => {}}
		onSortChange={() => {}}
		onGroupChange={() => {}}
		onAddTag={() => {}}
		onRemoveTag={() => {}}
		onUploadClick={() => {}}
	/>

	<main class="flex-1 overflow-y-auto bg-zinc-950">
		<div class="max-w-4xl mx-auto px-8 py-12 space-y-12">
			<div>
				<h1 class="text-3xl font-display font-bold text-zinc-100">Admin Settings</h1>
				<p class="text-zinc-500 mt-2">Manage site configuration and user access.</p>
			</div>

			{#if form?.message}
				<div class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
					{form.message}
				</div>
			{/if}

			{#if form?.success}
				<div class="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
					Action successful.
				</div>
			{/if}

			<div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
				<div class="px-8 py-6 border-b border-zinc-800/50">
					<h3 class="text-lg font-display font-medium text-zinc-100">Site Settings</h3>
				</div>
				<div class="p-8">
					<form method="POST" action="?/updateSettings" use:enhance class="space-y-6">
						<div class="flex items-center">
							<input
								type="checkbox"
								id="allow_new_registrations"
								name="allow_new_registrations"
								checked={settings.allow_new_registrations}
								class="h-5 w-5 bg-zinc-900 border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer"
							/>
							<label for="allow_new_registrations" class="ml-3 block text-sm font-medium text-zinc-300 cursor-pointer">
								Allow public registrations (if unchecked, invite is required)
							</label>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="max_image_size" class="block text-sm font-medium text-zinc-400 mb-2">Max Image Size (bytes, 0 = unlimited)</label>
								<input
									type="number"
									id="max_image_size"
									name="max_image_size"
									value={settings.max_image_size}
									class="block w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
								/>
							</div>
							<div>
								<label for="max_font_size" class="block text-sm font-medium text-zinc-400 mb-2">Max Font Size (bytes, 0 = unlimited)</label>
								<input
									type="number"
									id="max_font_size"
									name="max_font_size"
									value={settings.max_font_size}
									class="block w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
								/>
							</div>
						</div>

						<div class="pt-2">
							<button
								type="submit"
								class="inline-flex justify-center py-2.5 px-6 border border-transparent text-sm font-semibold rounded-lg text-zinc-950 bg-amber-500 hover:bg-orange-600 transition-colors cursor-pointer"
							>
								Save Settings
							</button>
						</div>
					</form>
				</div>
			</div>

			<div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
				<div class="px-8 py-6 border-b border-zinc-800/50 flex justify-between items-center">
					<h3 class="text-lg font-display font-medium text-zinc-100">Access</h3>
				</div>
				<div class="p-8">
					<form method="POST" action="?/createInvite" use:enhance class="flex gap-4 mb-8">
						<input
							type="email"
							name="email"
							placeholder="Email address"
							required
							class="block w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 placeholder:text-zinc-600"
						/>
						<button
							type="submit"
							class="inline-flex justify-center py-2.5 px-6 border border-transparent text-sm font-semibold rounded-lg text-zinc-950 bg-zinc-100 hover:bg-white transition-colors whitespace-nowrap cursor-pointer"
						>
							Grant Access
						</button>
					</form>

					<div class="overflow-x-auto rounded-lg border border-zinc-800/50">
						<table class="min-w-full divide-y divide-zinc-800/50">
							<thead class="bg-zinc-950/50">
								<tr>
									<th class="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
									<th class="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
									<th class="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-800/50">
								{#each invites as invite}
									<tr class="hover:bg-zinc-800/20 transition-colors">
										<td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{invite.email}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm">
											<span class="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full {invite.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-zinc-800 text-zinc-400'}">
												{invite.status}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											{#if invite.email === adminEmail}
												<span class="text-zinc-600 text-sm cursor-not-allowed" title="Cannot revoke your own access">Revoke</span>
											{:else}
												<form method="POST" action="?/deleteInvite" use:enhance class="inline">
													<input type="hidden" name="id" value={invite.id} />
													<button type="submit" class="text-red-400 hover:text-red-300 cursor-pointer">Revoke</button>
												</form>
											{/if}
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="3" class="px-6 py-8 text-center text-sm text-zinc-500">No entries.</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
