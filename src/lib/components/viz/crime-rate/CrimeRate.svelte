<script lang="ts">
	import { CrimeRateChart } from './crimerate';
	import * as d3 from 'd3';
	import { cn } from '$lib/utils/utils';
	import { base } from '$app/paths';

	let { class: className = '' } = $props();
	let visContainer: HTMLElement;
	let selectedNeighbourhood = $state('Toronto');

	$effect(() => {
		if (!visContainer) return;

		const initVis = async () => {
			const rawData = await d3.csv(`${base}/data/processed/neighbourhood-crime-rates.csv`);

			// Parse the CSV data to match CrimeData interface
			const parsedData = rawData.map((d) => ({
				year: +d.year,
				crime_type: d.crime_type,
				crime_rate: +d.crime_rate,
				neighbourhood: d.neighbourhood
			}));

			const crimeRateChart = new CrimeRateChart(
				{
					parentElement: visContainer,
					margin: { top: 40, right: 100, bottom: 40, left: 60 },
					onNeighbourhoodChange: (neighbourhood) => {
						selectedNeighbourhood = neighbourhood; // Update selected neighbourhood
					}
				},
				parsedData
			);

			crimeRateChart.updateVis();
		};

		initVis();
	});
</script>

<div class={cn('h-[400px] w-auto', className)}>
	<h1 class="text-center font-serif text-2xl italic">
		Crime Rates in {selectedNeighbourhood}
	</h1>
	<div bind:this={visContainer}></div>
</div>
