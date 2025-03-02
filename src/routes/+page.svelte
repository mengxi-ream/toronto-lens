<script lang="ts">
	import CrimeRate from '$lib/components/viz/crime-rate/CrimeRate.svelte';
	import Languages from '$lib/components/viz/languages/Languages.svelte';
	import Recommendation from '$lib/components/viz/recommendation/Recommendation.svelte';
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<div class="flex flex-col gap-4">
		<Recommendation />
		<div class="flex flex-row items-center justify-center gap-20">
			<CrimeRate />
			<Languages />
		</div>
	</div>
</section>
