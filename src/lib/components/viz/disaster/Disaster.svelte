<script lang="ts">
	import { Timeline } from './timeline';
	import * as d3 from 'd3';
	import { DisasterSchema } from '$lib/types/disaster';
	import { cn } from '$lib/utils/utils';

	let { class: className = '' } = $props();
	let visContainer: HTMLElement;

	$effect(() => {
		if (!visContainer) return;

		const initVis = async () => {
			const rawData = await d3.csv('/data/disaster_costs.csv');
			const data = rawData.map((row: unknown) => DisasterSchema.parse(row));

			const timeline = new Timeline(
				{
					parentElement: visContainer
				},
				data
			);

			timeline.updateVis();
		};

		initVis();
	});
</script>

<div class={cn('mx-auto w-[800px]', className)}>
	<h1 class="text-center font-serif text-2xl italic">The Cost of Natural Disasters</h1>
	<div bind:this={visContainer}></div>
</div>
