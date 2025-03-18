import {
	select,
	scaleTime,
	scaleLinear,
	scaleOrdinal,
	line,
	extent,
	max,
	axisBottom,
	axisLeft,
	easeLinear,
	type Selection,
	type ScaleTime,
	type ScaleLinear,
	type ScaleOrdinal
} from 'd3';
import { colorSchema } from '$lib/utils/colorSchema';
import type { CrimeData } from '$lib/types/data/crime-rate';
import type { CrimeRateConfig } from '$lib/types/chart/layout';
import merge from 'deepmerge';
import { get } from 'svelte/store';
import { selectedNeighbourhood } from '$lib/stores/map';

const defaultConfig: Required<CrimeRateConfig> = {
	margin: { top: 40, right: 20, bottom: 20, left: 45 },
	tooltip: { padding: 15 },
	legend: { width: 5, height: 5, radius: 5 }
};

export class CrimeRateChart {
	private parentElement: HTMLElement;
	private config: Required<CrimeRateConfig>;
	private width: number;
	private height: number;
	private svg!: Selection<SVGSVGElement, unknown, null, undefined>;
	private chart!: Selection<SVGGElement, unknown, null, undefined>;
	private xScale!: ScaleTime<number, number>;
	private yScale!: ScaleLinear<number, number>;
	private colorScale!: ScaleOrdinal<string, string>;
	private xAxis!: Selection<SVGGElement, unknown, null, undefined>;
	private yAxis!: Selection<SVGGElement, unknown, null, undefined>;
	private data: CrimeData[];

	constructor(
		parentElement: HTMLElement,
		data: CrimeData[],
		config: CrimeRateConfig = defaultConfig
	) {
		this.parentElement = parentElement;
		this.config = merge(defaultConfig, config);
		this.data = data;

		const containerRect = this.parentElement.getBoundingClientRect();
		this.width = containerRect.width - this.config.margin.left - this.config.margin.right;
		this.height = containerRect.height - this.config.margin.top - this.config.margin.bottom;

		const container = select(this.parentElement);
		this.svg = container
			.append('svg')
			.attr('width', containerRect.width)
			.attr('height', containerRect.height);

		this.chart = this.svg
			.append('g')
			.attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

		// Initialize scales
		this.xScale = scaleTime().range([0, this.width]);
		this.yScale = scaleLinear().range([this.height, 0]);
		this.colorScale = scaleOrdinal(colorSchema);

		// Initialize axes with custom tick formatting
		this.xAxis = this.chart.append('g').attr('transform', `translate(0,${this.height})`);
		this.yAxis = this.chart.append('g');

		// Add axis labels
		this.chart
			.append('text')
			.attr('class', 'axis-label')
			.attr('y', this.height + 35)
			.attr('x', this.width / 2)
			.style('text-anchor', 'middle')
			.text('Year');

		this.chart
			.append('text')
			.attr('class', 'axis-label')
			.attr('transform', 'rotate(-90)')
			.attr('y', -45)
			.attr('x', -this.height / 2)
			.style('text-anchor', 'middle')
			.text('Crime Rate (per 100,000 population)');

		// Add tooltip div
		select('body')
			.append('div')
			.attr('id', 'crime-tooltip')
			.style('position', 'absolute')
			.style('opacity', 0)
			.style('background', 'white')
			.style('border', '1px solid #ddd')
			.style('padding', '10px')
			.style('border-radius', '4px')
			.style('pointer-events', 'none')
			.style('font-size', '12px')
			.style('box-shadow', '0 2px 5px rgba(0, 0, 0, 0.1)')
			.style('z-index', '1000');
	}

	public updateVis(): void {
		const filteredData = this.data.filter(
			(d) => d.neighbourhood === (get(selectedNeighbourhood) ?? 'Toronto')
		);

		// Group data by crime type
		const crimeTypes = Array.from(new Set(filteredData.map((d) => d.crime_type)));

		// Clear existing paths
		this.chart.selectAll('.line').remove();

		// Update scales
		this.xScale.domain(extent(filteredData, (d) => new Date(d.year, 0)) as [Date, Date]);
		const maxCrimeRate = max(filteredData, (d) => +d.crime_rate) as number;
		this.yScale.domain([0, maxCrimeRate * 1.1]);
		this.colorScale.domain(crimeTypes);

		// Create line generator
		const lineGenerator = line<CrimeData>()
			.x((d) => this.xScale(new Date(d.year, 0)))
			.y((d) => this.yScale(+d.crime_rate));

		// Draw lines with points
		crimeTypes.forEach((crimeType) => {
			const crimeData = filteredData.filter((d) => d.crime_type === crimeType);

			// Draw the line with left-to-right animation
			const path = this.chart
				.append('path')
				.datum(crimeData)
				.attr('class', `line line-${crimeType.replace(/\s+/g, '-')}`)
				.attr('d', lineGenerator)
				.style('fill', 'none')
				.style('stroke', this.colorScale(crimeType))
				.style('stroke-width', 2);

			// Get the total length of the path
			const pathLength = path.node()?.getTotalLength() || 0;

			// Set up the animation using stroke-dasharray and stroke-dashoffset
			path
				.attr('stroke-dasharray', pathLength)
				.attr('stroke-dashoffset', pathLength)
				.transition()
				.duration(1500)
				.ease(easeLinear)
				.attr('stroke-dashoffset', 0)
				.on('end', function () {
					// Remove the dash array after animation completes
					select(this).attr('stroke-dasharray', null);
				});

			// Add points with delayed appearance
			this.chart
				.selectAll(`.point-${crimeType.replace(/\s+/g, '-')}`)
				.data(crimeData)
				.join('circle')
				.attr('class', `point-${crimeType.replace(/\s+/g, '-')}`)
				.attr('cx', (d) => this.xScale(new Date(d.year, 0)))
				.attr('cy', (d) => this.yScale(+d.crime_rate))
				.attr('r', 0) // Start with radius 0
				.style('fill', this.colorScale(crimeType))
				.style('stroke', '#fff')
				.style('stroke-width', 1.5)
				.on('mouseover', (event, d) => {
					select(event.currentTarget).attr('r', 7).style('stroke-width', 2);

					select('#crime-tooltip')
						.style('opacity', 1)
						.html(
							`<div class="tooltip-label">
							<strong>${crimeType}</strong><br>
							Year: ${d.year}<br>
							Crime Rate: ${d.crime_rate.toFixed(1)} per 100,000
						</div>`
						)
						.style('left', event.pageX + this.config.tooltip.padding + 'px')
						.style('top', event.pageY + this.config.tooltip.padding + 'px');
				})
				.on('mousemove', (event) => {
					select('#crime-tooltip') // Updated ID
						.style('left', event.pageX + this.config.tooltip.padding + 'px')
						.style('top', event.pageY + this.config.tooltip.padding + 'px');
				})
				.on('mouseout', (event) => {
					select(event.currentTarget).attr('r', 5).style('stroke-width', 1.5);

					select('#crime-tooltip').style('opacity', 0);
				});

			// Animate points to appear as the line reaches them
			this.chart
				.selectAll(`.point-${crimeType.replace(/\s+/g, '-')}`)
				.transition()
				.delay((d, i) => (i * 1500) / crimeData.length) // Delay based on position
				.duration(300)
				.attr('r', 5); // Grow to full size
		});

		// Clear existing legend
		this.chart.selectAll('.legend').remove();

		// Add legend with interactivity
		const legend = this.chart
			.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${this.width + 10}, 0)`);

		// Track active crime types (initially all are active)
		const activeCrimeTypes = new Set(crimeTypes);

		// Function to create a consistent y-axis generator
		const createYAxisGenerator = () => {
			const maxValue = this.yScale.domain()[1];

			// Round up maxValue to nearest 100 or 50
			const roundTo = maxValue > 500 ? 100 : 50;
			const roundedMax = Math.ceil(maxValue / roundTo) * roundTo;

			// Create evenly spaced tick values
			const tickCount = 6;
			const tickStep = roundedMax / (tickCount - 1);
			const tickValues = Array.from({ length: tickCount }, (_, i) => i * tickStep);

			// Update the scale domain to match our rounded max
			this.yScale.domain([0, roundedMax]);

			return axisLeft(this.yScale)
				.tickValues(tickValues)
				.tickFormat((d) => {
					const value = +d; // Convert to number
					if (value >= 1000) {
						return (value / 1000).toFixed(1) + 'k';
					}
					return value.toFixed(0);
				});
		};

		// Function to update the chart based on active crime types
		const updateChart = () => {
			// Filter data for only active crime types
			const activeData = filteredData.filter((d) => activeCrimeTypes.has(d.crime_type));

			// Recalculate y-axis domain based on active data
			const maxCrimeRate = max(activeData, (d) => +d.crime_rate) as number;
			this.yScale.domain([0, maxCrimeRate * 1.1]);

			// Update y-axis with animation
			this.yAxis.transition().duration(500).call(createYAxisGenerator());

			// Update visibility and positions of lines and points
			crimeTypes.forEach((type) => {
				const isActive = activeCrimeTypes.has(type);

				// Update lines
				this.chart
					.selectAll(`.line-${type.replace(/\s+/g, '-')}`)
					.style('opacity', isActive ? 1 : 0)
					.transition()
					.duration(500)
					.attr('d', (d) => lineGenerator(d as CrimeData[]));

				// Update points
				this.chart
					.selectAll(`.point-${type.replace(/\s+/g, '-')}`)
					.style('opacity', isActive ? 1 : 0)
					.transition()
					.duration(500)
					.attr('cy', (d) => this.yScale(+d.crime_rate));
			});
		};

		crimeTypes.forEach((crimeType, i) => {
			const legendRow = legend
				.append('g')
				.attr('class', 'legend-row')
				.attr('transform', `translate(0, ${i * 20})`)
				.style('cursor', 'pointer')
				.on('click', () => {
					// Toggle this crime type's active state
					if (activeCrimeTypes.has(crimeType)) {
						if (activeCrimeTypes.size > 1) {
							activeCrimeTypes.delete(crimeType);
						}
					} else {
						activeCrimeTypes.add(crimeType);
					}

					// Update opacity of legend items
					legend.selectAll('.legend-row').style('opacity', (d, j) => {
						const currentCrimeType = crimeTypes[j];
						return activeCrimeTypes.has(currentCrimeType) ? 1 : 0.5;
					});

					// Update chart with new active crime types
					updateChart();
				});

			// Add colored rectangle
			legendRow
				.append('rect')
				.attr('width', this.config.legend.width)
				.attr('height', this.config.legend.height)
				.style('fill', this.colorScale(crimeType));

			// Add text label
			legendRow
				.append('text')
				.attr('x', 20)
				.attr('y', 10)
				.style('font-size', '12px')
				.text(crimeType);
		});

		// Initial y-axis setup
		this.yAxis.call(createYAxisGenerator());

		// Update axes
		this.xAxis.call(axisBottom(this.xScale));
	}
}
