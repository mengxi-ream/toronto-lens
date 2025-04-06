<script lang="ts">
	import { Slider, Select } from 'bits-ui';
	import { filterRanges, type FilterRanges } from '$lib/stores/filter';
	import { selectedMetric } from '$lib/stores/map';
	import Icon from '$lib/icons/Icon.svelte';

	const ICONS = {
		caretDown:
			'M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z',
		check:
			'M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z',
		list: 'M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128ZM40,76H216a12,12,0,0,0,0-24H40a12,12,0,0,0,0,24ZM216,180H40a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Z'
	};

	const metricDisplayNames: Record<keyof FilterRanges, string> = {
		population_density: 'Population Density',
		household_income: 'Household Income',
		crime_rate: 'Overall Crime Rate',
		cultural_diversity: 'Cultural Diversity Index'
	};

	const metrics = Object.entries(metricDisplayNames).map(([value, label]) => ({
		value,
		label
	}));

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

<div>
	<div class="flex flex-col gap-4 rounded-lg border border-purple-100 bg-white p-4 shadow-sm">
		<h3 class="text-lg font-semibold">Filter Neighbourhood Metrics</h3>
		<Select.Root type="single" onValueChange={(v) => ($selectedMetric = v)} items={metrics}>
			<Select.Trigger
				class="h-input inline-flex w-full items-center rounded-md border border-purple-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors select-none hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none data-placeholder:text-gray-500"
				aria-label="Select a metric"
			>
				<Icon path={ICONS.list} class="mr-2 text-purple-500" size={20} />
				{$selectedMetric
					? metricDisplayNames[$selectedMetric as keyof FilterRanges]
					: 'Select a metric'}
				<Icon path={ICONS.caretDown} class="ml-auto text-purple-500" size={20} />
			</Select.Trigger>
			<Select.Portal>
				<Select.Content
					class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-[var(--bits-select-content-available-height)] w-[var(--bits-select-trigger-width)] min-w-[var(--bits-select-trigger-width)] rounded-md border border-purple-100 bg-white p-1 shadow-lg select-none"
					sideOffset={5}
				>
					<Select.Viewport class="p-1">
						{#each metrics as metric}
							<Select.Item
								class="flex h-9 w-full items-center rounded-md px-4 py-2 text-sm text-gray-700 outline-hidden select-none data-highlighted:bg-purple-50 data-highlighted:text-purple-900"
								value={metric.value}
								label={metric.label}
							>
								{#snippet children({ selected })}
									{#if selected}
										<div class="mr-2">
											<Icon path={ICONS.check} class="text-purple-500" size={16} />
										</div>
									{/if}
									{metric.label}
								{/snippet}
							</Select.Item>
						{/each}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
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
</div>
