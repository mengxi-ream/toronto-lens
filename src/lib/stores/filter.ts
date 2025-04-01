import { writable } from 'svelte/store';

export type FilterRange = {
	min: number;
	max: number;
};

export type FilterRanges = {
	population_density: FilterRange;
	household_income: FilterRange;
	crime_rate: FilterRange;
	cultural_diversity: FilterRange;
};

export const filterRanges = writable<FilterRanges>({
	population_density: { min: 1200, max: 50000 },
	household_income: { min: 100000, max: 1500000 },
	crime_rate: { min: 350, max: 5000 },
	cultural_diversity: { min: 2.5, max: 7 }
});
