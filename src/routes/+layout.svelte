<script lang="ts">
	import '../app.css';
	import Icon from '$lib/icons/Icon.svelte';

	let { children } = $props();

	// GitHub icon path from Phosphor Icons
	const githubPath =
		'M128 24C65 24 16 74.2 16 138.3c0 51.8 32.8 95.5 78.5 111 5.8 1 7.9-2.5 7.9-5.5 0-2.8-.1-11.9-.2-21.9-32 7-38.7-13.5-38.7-13.5-5.2-13.4-12.8-16.9-12.8-16.9-10.5-7.2 .8-7 .8-7 11.6 .8 17.7 11.9 17.7 11.9 10.3 17.7 27 12.6 33.6 9.6 1-7.5 4-12.6 7.3-15.5-25.6-3-52.4-13-52.4-57.5 0-12.7 4.5-23.2 11.9-31.3-1.2-2.9-5.2-14.8 1.1-30.8 0 0 9.7-3.1 31.8 11.9 9.2-2.6 19.1-3.9 29-3.9 9.9 0 19.8 1.3 29 3.9 22.1-15 31.8-11.9 31.8-11.9 6.3 16 2.3 27.9 1.1 30.8 7.5 8.1 11.9 18.6 11.9 31.3 0 44.7-26.9 54.4-52.6 57.3 4.2 3.6 7.9 10.7 7.9 21.6 0 15.5-.1 28.1-.1 31.9 0 3.1 2.1 6.6 7.9 5.5C207.2 233.8 240 190.1 240 138.3 240 74.2 191 24 128 24z';
</script>

<div class="flex min-h-[100vh] flex-col">
	<main class="mx-auto w-full max-w-7xl px-6 md:px-14">
		{@render children()}
	</main>
	<footer class="mt-auto py-6">
		<div class="mx-auto flex w-full max-w-7xl justify-center px-6 md:px-14">
			<a
				href="https://github.com/mengxi-ream/toronto-lens"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
			>
				<Icon path={githubPath} size={24} />
				<span>toronto-lens</span>
			</a>
		</div>
	</footer>
</div>

<style>
</style>
