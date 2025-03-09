<script lang="ts">
	import { onMount } from 'svelte';
	import { RecommendationChart } from './recommendation';
	import * as d3 from 'd3';
	import { cn } from '$lib/utils/utils';
	import { base } from '$app/paths';
	import type { TorontoTopology, TorontoGeometry } from './types';

	let { class: className = '' } = $props();
	let vizContainer: HTMLElement;
	let chart: RecommendationChart;

	interface PopulationData {
		neighbourhood: string;
		population_density: string;
	}

	onMount(async () => {
		try {
			// Load both the TopoJSON and population data
			const [topoData, populationData] = await Promise.all([
				d3.json(`${base}/data/original/neighbourhoods.json`) as Promise<TorontoTopology>,
				d3.csv(`${base}/data/processed/select-filter.csv`) as Promise<PopulationData[]>
			]);

			if (!topoData || !populationData) throw new Error('Failed to load data');

			// Create a map of neighborhood to population density
			const densityMap = new Map(
				populationData.map((d) => [d.neighbourhood, +d.population_density])
			);

			// Add population density to the TopoJSON data
			topoData.objects.neighbourhoods.geometries.forEach((d: TorontoGeometry) => {
				d.properties.population_density = densityMap.get(d.properties.neighbourhood) || 0;
			});

			// Initialize the chart
			chart = new RecommendationChart(
				{
					parentElement: vizContainer,
					containerWidth: 700,
					containerHeight: 500,
					margin: { top: 40, right: 20, bottom: 40, left: 20 },
					tooltipPadding: 10
				},
				topoData
			);

			// Update the visualization
			chart.updateVis();
		} catch (error) {
			console.error('Error loading data:', error);
		}
	});
</script>

<div class={cn('h-[500px] w-[700px]', className)}>
	<h1 class="mb-4 text-center font-serif text-2xl italic">Toronto Neighbourhood</h1>
	<div bind:this={vizContainer} class="h-[calc(100%-2rem)]"></div>
	<div id="tooltip"></div>
</div>
