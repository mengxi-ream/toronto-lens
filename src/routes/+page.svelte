<script lang="ts">
	import CrimeRate from '$lib/components/viz/crime-rate/CrimeRate.svelte';
	import Maps from '$lib/components/viz/maps/Maps.svelte';
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1 class="py-5 text-center text-4xl font-bold">Dashboard Title</h1>
	<div class="grid w-full grid-cols-1 gap-4 py-4 lg:grid-cols-3 lg:grid-rows-2">
		<div class="order-2 flex items-center lg:order-1 lg:col-span-2 lg:row-span-2">
			<Maps class="h-[800px] w-full" />
		</div>
		<div class="order-1 flex items-center bg-amber-500 lg:order-2">
			<div class="h-[300px] w-full bg-red-300">Filter</div>
		</div>
		<div class="order-3 flex items-center bg-amber-500 lg:order-3">
			<div class="h-[200px] w-full bg-red-300">Table</div>
		</div>
	</div>
	<div class="grid w-full grid-cols-1 gap-4 py-4 lg:grid-cols-2 lg:grid-rows-2">
		<div class="col-span-1 flex items-center">
			<CrimeRate class="h-[400px] w-full" />
		</div>
		<div class="flex items-center bg-amber-500">
			<div class="h-[400px] w-full bg-red-300">Language chart</div>
		</div>
	</div>
</section>
