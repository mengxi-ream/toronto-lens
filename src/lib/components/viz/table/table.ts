import { select, type Selection } from 'd3';
import type { NeighbourhoodData } from '$lib/types/data/neighbourhood';
import { selectedMetric } from '$lib/stores/map';
import { filterRanges } from '$lib/stores/filter';
import { get } from 'svelte/store';
import { selectedNeighbourhood } from '$lib/stores/map';

export class Table {
	private parentElement: HTMLElement;
	private data: NeighbourhoodData[];
	private filteredData: NeighbourhoodData[];
	private table!: Selection<HTMLTableElement, unknown, null, undefined>;
	private thead!: Selection<HTMLTableSectionElement, unknown, null, undefined>;
	private tbody!: Selection<HTMLTableSectionElement, unknown, null, undefined>;
	private container!: Selection<HTMLElement, unknown, null, undefined>;
	private metricUnsubscribe: () => void;
	private filterUnsubscribe: () => void;
	private neighbourhoodUnsubscribe: () => void;
	private width: number;
	private height: number;
	private config = { margin: { top: 10, right: 5, bottom: 10, left: 5 } };

	constructor(parentElement: HTMLElement, data: NeighbourhoodData[]) {
		this.parentElement = parentElement;
		this.data = data;
		this.filteredData = [];

		const containerRect = this.parentElement.getBoundingClientRect();
		this.width = containerRect.width - this.config.margin.left - this.config.margin.right;
		this.height = containerRect.height - this.config.margin.top - this.config.margin.bottom;
		this.height += 100;

		// Initialize container reference
		this.container = select(this.parentElement);

		// Initialize container and base structure
		this.initVis();

		// Subscribe to store changes
		this.metricUnsubscribe = selectedMetric.subscribe(() => {
			this.updateVis();
		});

		this.filterUnsubscribe = filterRanges.subscribe(() => {
			this.updateVis();
		});

		// Subscribe to neighborhood selection changes
		this.neighbourhoodUnsubscribe = selectedNeighbourhood.subscribe(() => {
			this.updateVis();
		});

		// Initial update
		this.updateVis();
	}

	private initVis(): void {
		// Initialize the container with basic styling
		this.container
			.style('width', '100%')
			.style('height', `${this.height + this.config.margin.top + this.config.margin.bottom}px`)
			.style('overflow-y', 'auto')
			.style('overflow-x', 'auto')
			.style('background-color', 'white')
			.style('position', 'relative')
			.style('border-radius', '0.75rem')
			.style('border', '1px solid #e2e8f0');

		// Remove any existing content
		this.container.selectAll('*').remove();

		// Create the table with basic styling
		this.table = this.container
			.append('table')
			.attr('width', '100%')
			.style('width', '100%')
			.style('min-width', '800px')
			.style('height', '100%')
			.style('table-layout', 'auto')
			.style('border-collapse', 'separate')
			.style('border-spacing', '0');

		// Create table header - make position fixed
		this.thead = this.table
			.append('thead')
			.style('position', 'sticky')
			.style('top', '0')
			.style('z-index', '20')
			.style('background-color', '#f8fafc')
			.style('box-shadow', '0 1px 2px rgba(0,0,0,0.1)');

		// Create table body
		this.tbody = this.table.append('tbody');

		// Add headers
		this.createHeaders();

		console.log('Table initialized:', this.table.node());
	}

	private createHeaders(): void {
		const headers = [
			'Neighbourhood',
			'Population Density',
			'Household Income',
			'Crime Rate',
			'Cultural Diversity'
		];

		// The header row itself doesn't need to be sticky, just the thead element
		const headerRow = this.thead.append('tr').style('height', '50px');

		// Set min-width for each column type
		const columnWidths = [
			'100px', // Neighbourhood
			'150px', // Population Density
			'150px', // Household Income
			'150px', // Crime Rate
			'150px' // Cultural Diversity
		];

		// First th gets left rounded corners
		headerRow
			.append('th')
			.style('text-align', 'center')
			.style('padding', '12px')
			.style('font-weight', 'bold')
			.style('border-bottom', '2px solid #e2e8f0')
			.style('border-right', '1px solid #e2e8f0')
			.style('min-width', columnWidths[0])
			.style('color', '#1e293b')
			.style('text-transform', 'uppercase')
			.style('font-size', '0.875rem')
			.style('letter-spacing', '0.025em')
			.style('background-color', '#f8fafc')
			.style('border-top-left-radius', '0.5rem')
			.text(headers[0]);

		// Middle headers
		for (let i = 1; i < headers.length - 1; i++) {
			headerRow
				.append('th')
				.style('text-align', 'center')
				.style('padding', '12px')
				.style('font-weight', 'bold')
				.style('border-bottom', '2px solid #e2e8f0')
				.style('border-right', '1px solid #e2e8f0')
				.style('min-width', columnWidths[i])
				.style('color', '#1e293b')
				.style('text-transform', 'uppercase')
				.style('font-size', '0.875rem')
				.style('letter-spacing', '0.025em')
				.style('background-color', '#f8fafc')
				.text(headers[i]);
		}

		// Last th gets right rounded corners
		headerRow
			.append('th')
			.style('text-align', 'center')
			.style('padding', '12px')
			.style('font-weight', 'bold')
			.style('border-bottom', '2px solid #e2e8f0')
			.style('min-width', columnWidths[headers.length - 1])
			.style('color', '#1e293b')
			.style('text-transform', 'uppercase')
			.style('font-size', '0.875rem')
			.style('letter-spacing', '0.025em')
			.style('background-color', '#f8fafc')
			.style('border-top-right-radius', '0.5rem')
			.text(headers[headers.length - 1]);
	}

	public updateVis(): void {
		const currentFilterRanges = get(filterRanges);

		// Filter data based on all metrics at once
		this.filteredData = this.data.filter((d) => {
			// Check if all metrics are within their filter ranges
			return Object.entries(currentFilterRanges).every(([metricKey, range]) => {
				let value: number;

				// Map the metric key to the corresponding data field
				switch (metricKey) {
					case 'population_density':
						value = d.population_density;
						break;
					case 'household_income':
						value = d['Average after-tax income of households in 2015 ($)'];
						break;
					case 'crime_rate':
						value = d.overall_crime_rate;
						break;
					case 'cultural_diversity':
						value = d.shannon_diversity;
						break;
					default:
						return true;
				}

				return typeof value === 'number' && value >= range.min && value <= range.max;
			});
		});

		console.log(`Filtered data to ${this.filteredData.length} rows based on all metrics`);

		// Clear existing rows
		this.tbody.selectAll('tr').remove();

		// Create rows for each data point
		this.filteredData.forEach((d, index) => {
			const isLastRow = index === this.filteredData.length - 1;
			const isSelected = d.neighbourhood === get(selectedNeighbourhood);

			const row = this.tbody
				.append('tr')
				.style('height', '40px')
				.style('transition', 'all 0.2s ease')
				.style('background-color', isSelected ? '#e0f2fe' : index % 2 === 0 ? 'white' : '#f0faf0')
				.style('cursor', 'pointer')
				.on('click', () => {
					// Update selectedNeighbourhood store when a row is clicked
					selectedNeighbourhood.update((value) => {
						if (value === d.neighbourhood) {
							return null;
						} else {
							return d.neighbourhood;
						}
					});
				})
				.on('mouseover', function () {
					select(this)
						.style('background-color', isSelected ? '#bae6fd' : '#f1f5f9')
						.style('transform', 'translateY(-1px)')
						.style('box-shadow', '0 2px 4px rgba(0,0,0,0.05)');
				})
				.on('mouseout', function () {
					select(this)
						.style(
							'background-color',
							isSelected ? '#e0f2fe' : index % 2 === 0 ? 'white' : '#f0faf0'
						)
						.style('transform', 'translateY(0)')
						.style('box-shadow', 'none');
				});

			// Values for each cell
			const values = [
				d.neighbourhood,
				d.population_density.toFixed(2),
				`$${d['Average after-tax income of households in 2015 ($)'].toLocaleString()}`,
				d.overall_crime_rate.toFixed(2),
				d.shannon_diversity.toFixed(2)
			];

			// First cell (might need bottom-left rounding if last row)
			const firstCell = row
				.append('td')
				.style('padding', '8px 12px')
				.style('text-align', 'center')
				.style('vertical-align', 'middle')
				.style('white-space', 'nowrap')
				.style('border-right', '1px solid #e2e8f0')
				.style('color', isSelected ? '#0369a1' : '#334155')
				.style('font-weight', isSelected ? 'bold' : 'normal')
				.style('font-size', '0.875rem');

			if (isLastRow) {
				firstCell.style('border-bottom-left-radius', '0.5rem');
			}
			firstCell.text(values[0]);

			// Middle cells
			for (let i = 1; i < values.length - 1; i++) {
				row
					.append('td')
					.style('padding', '8px 12px')
					.style('text-align', 'center')
					.style('vertical-align', 'middle')
					.style('white-space', 'nowrap')
					.style('border-right', '1px solid #e2e8f0')
					.style('color', isSelected ? '#0369a1' : '#334155')
					.style('font-size', '0.875rem')
					.text(values[i]);
			}

			// Last cell (might need bottom-right rounding if last row)
			const lastCell = row
				.append('td')
				.style('padding', '8px 12px')
				.style('text-align', 'center')
				.style('vertical-align', 'middle')
				.style('white-space', 'nowrap')
				.style('color', isSelected ? '#0369a1' : '#334155')
				.style('font-size', '0.875rem');

			if (isLastRow) {
				lastCell.style('border-bottom-right-radius', '0.5rem');
			}
			lastCell.text(values[values.length - 1]);

			// Add subtle bottom border for all rows except the last one
			if (!isLastRow) {
				row.style('border-bottom', '1px solid #e2e8f0');
			}
		});

		console.log('Table updated with', this.filteredData.length, 'rows');
	}

	public updateData(newData: NeighbourhoodData[]): void {
		this.data = newData;
		this.updateVis();
	}

	public updateFilters(): void {
		this.updateVis();
	}

	public resize(width: number, height: number): void {
		// Update dimensions
		this.width = width - this.config.margin.left - this.config.margin.right;
		this.height = height - this.config.margin.top - this.config.margin.bottom;
		this.height += 100; // Make table higher

		// Update container dimensions
		this.container
			.style('width', '100%')
			.style('height', `${height}px`)
			.style('overflow-y', 'auto')
			.style('overflow-x', 'auto');

		// Update table dimensions
		this.table
			.attr('width', '100%')
			.style('width', '100%')
			.style('min-width', '800px')
			.style('height', '100%');
	}

	public destroy(): void {
		// Clean up subscriptions
		if (this.metricUnsubscribe) this.metricUnsubscribe();
		if (this.filterUnsubscribe) this.filterUnsubscribe();
		if (this.neighbourhoodUnsubscribe) this.neighbourhoodUnsubscribe();

		// Clean up by removing all elements
		if (this.parentElement) {
			select(this.parentElement).selectAll('*').remove();
		}
	}
}
