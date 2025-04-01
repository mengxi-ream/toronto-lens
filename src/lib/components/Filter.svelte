<script lang="ts">
	import { Slider } from 'bits-ui';
	import { filterRanges, type FilterRanges } from '$lib/stores/filter';
	import { cn } from '$lib/utils/utils';

	let { class: className = '' } = $props();

	const metricDisplayNames: Record<keyof FilterRanges, string> = {
		population_density: 'Population Density',
		household_income: 'Household Income',
		crime_rate: 'Overall Crime Rate',
		cultural_diversity: 'Cultural Diversity Index'
	};

	const formatValue = (metric: keyof FilterRanges, value: number) => {
		switch (metric) {
			case 'household_income':
				return `$${value.toLocaleString()}`;
			case 'population_density':
				return `${value.toLocaleString()}/km²`;
			case 'crime_rate':
				return value.toLocaleString();
			case 'cultural_diversity':
				return value.toFixed(2);
			default:
				return value.toString();
		}
	};

	type OnValueChangeFn = (value: number[]) => void;
	const handleValueChange = (metric: keyof FilterRanges): OnValueChangeFn => {
		return (value) => {
			if (value.length === 2) {
				// Update filterRanges directly
				filterRanges.update((ranges) => {
					const newRanges = { ...ranges };
					newRanges[metric] = { min: value[0], max: value[1] };
					return newRanges;
				});
			}
		};
	};

	const handleReset = () => {
		// Reset all values to initial ranges
		filterRanges.set({
			population_density: { min: 1200, max: 50000 },
			household_income: { min: 100000, max: 1500000 },
			crime_rate: { min: 350, max: 5000 },
			cultural_diversity: { min: 2.5, max: 7 }
		});
	};
</script>

<div class={cn('flex h-full w-full flex-col gap-8 p-6', className)}>
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Filter Neighbourhoods</h3>
		<div class="flex gap-2">
			<button
				class="rounded-md bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 hover:bg-purple-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
				onclick={handleReset}
			>
				Reset
			</button>
		</div>
	</div>
	{#each Object.entries($filterRanges) as [metric, range]}
		{@const key = metric as keyof FilterRanges}
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium">{metricDisplayNames[key]}</span>
				<span class="text-xs text-gray-500">
					{formatValue(key, range.min)} - {formatValue(key, range.max)}
				</span>
			</div>
			<Slider.Root
				type="multiple"
				min={key === 'household_income'
					? 100000
					: key === 'population_density'
						? 1200
						: key === 'crime_rate'
							? 350
							: 2.5}
				max={key === 'household_income'
					? 1500000
					: key === 'population_density'
						? 50000
						: key === 'crime_rate'
							? 5000
							: 7}
				step={key === 'cultural_diversity' ? 0.1 : key === 'household_income' ? 10000 : 100}
				value={[range.min, range.max]}
				onValueChange={handleValueChange(key)}
				class="relative flex w-full touch-none items-center select-none"
			>
				{#snippet children()}
					<span
						class="relative h-1.5 w-full grow cursor-pointer overflow-hidden rounded-full bg-purple-100"
					>
						<Slider.Range class="absolute h-full bg-purple-500" />
					</span>
					<Slider.Thumb
						index={0}
						class="group relative block h-4 w-4 cursor-pointer rounded-full border border-purple-500 bg-white shadow-sm transition-colors hover:border-purple-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
					>
						<div
							class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100"
						>
							{formatValue(key, range.min)}
						</div>
					</Slider.Thumb>
					<Slider.Thumb
						index={1}
						class="group relative block h-4 w-4 cursor-pointer rounded-full border border-purple-500 bg-white shadow-sm transition-colors hover:border-purple-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
					>
						<div
							class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100"
						>
							{formatValue(key, range.max)}
						</div>
					</Slider.Thumb>
				{/snippet}
			</Slider.Root>
		</div>
	{/each}
</div>
