<script lang="ts">
	import { CrimeRateChart } from './crimerate';
	import * as d3 from 'd3';
	import { cn } from '$lib/utils/utils';
	import { base } from '$app/paths';

	let { class: className = '' } = $props();
	let visContainer: HTMLElement;

	$effect(() => {
		if (!visContainer) return;

		const initVis = async () => {
			const rawData = await d3.csv(`${base}/data/processed/toronto-crime-rate.csv`);

			const crimeRateChart = new CrimeRateChart(
				{
					parentElement: visContainer,
					margin: { top: 40, right: 100, bottom: 40, left: 60 }
				},
				rawData
			);

			crimeRateChart.updateVis();
		};

		initVis();
	});
</script>

<div class={cn('h-[400px] w-auto', className)}>
	<h1 class="text-center font-serif text-2xl italic">Crime Rates</h1>
	<div bind:this={visContainer}></div>
</div>
