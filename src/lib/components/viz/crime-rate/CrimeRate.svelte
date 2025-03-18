<script lang="ts">
	import { CrimeRateChart } from './crime-rate';
	import * as d3 from 'd3';
	import { cn } from '$lib/utils/utils';
	import { base } from '$app/paths';
	import { crimeRateSchema } from '$lib/types/data/crime-rate';
	import { selectedNeighbourhood } from '$lib/stores/map';

	let { class: className = '' } = $props();
	let visContainer: HTMLElement;
	let crimeRateChart: CrimeRateChart;

	$effect(() => {
		if (!visContainer) return;

		const initVis = async () => {
			const rawData = await d3.csv(`${base}/data/processed/neighbourhood-crime-rates.csv`);
			const data = rawData.map((row: unknown) => crimeRateSchema.parse(row));

			crimeRateChart = new CrimeRateChart(visContainer, data, {
				margin: {
					top: 40,
					right: 100,
					bottom: 40,
					left: 60
				}
			});

			crimeRateChart.updateVis();
		};

		initVis();
	});

	$effect(() => {
		const _selectedNeighbourhood = $selectedNeighbourhood;

		if (crimeRateChart) {
			crimeRateChart.updateVis();
		}
	});
</script>

<div class={cn('flex flex-col', className)}>
	<h1 class="text-center font-serif text-2xl italic">
		Crime Rates in {$selectedNeighbourhood ?? 'Toronto'}
	</h1>
	<div bind:this={visContainer} class="relative flex-1"></div>
</div>
