import * as d3 from 'd3';
import { colorSchema } from '$lib/utils/colorSchema';
import type { CrimeRateConfig } from '$lib/types/chart/crime-chart';
import type { CrimeData } from '$lib/types/data/crime-rate';

export class CrimeRateChart {
	private config: CrimeRateConfig;
	private width: number;
	private height: number;
	private margin: { top: number; right: number; bottom: number; left: number };
	private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	private chart!: d3.Selection<SVGGElement, unknown, null, undefined>;
	private xScale!: d3.ScaleTime<number, number>;
	private yScale!: d3.ScaleLinear<number, number>;
	private colorScale!: d3.ScaleOrdinal<string, string>;
	private xAxis!: d3.Selection<SVGGElement, unknown, null, undefined>;
	private yAxis!: d3.Selection<SVGGElement, unknown, null, undefined>;
	private data: CrimeData[];
	private neighbourhoods: string[] = [];
	private currentNeighbourhood: string = 'Toronto';
	private dropdown!: d3.Selection<HTMLSelectElement, unknown, null, undefined>;

	constructor(config: CrimeRateConfig, data: CrimeData[]) {
		this.config = {
			parentElement: config.parentElement,
			containerWidth: config.containerWidth ?? 600,
			containerHeight: config.containerHeight ?? 300,
			tooltipPadding: config.tooltipPadding ?? 15,
			margin: config.margin ?? { top: 40, right: 20, bottom: 20, left: 45 },
			legendWidth: config.legendWidth ?? 5,
			legendHeight: config.legendHeight ?? 5,
			legendRadius: config.legendRadius ?? 5,
			onNeighbourhoodChange: config.onNeighbourhoodChange
		};

		this.data = data;

		// Set default values
		this.margin = this.config.margin ?? { top: 120, right: 20, bottom: 20, left: 45 };
		const containerWidth = this.config.containerWidth;
		const containerHeight = this.config.containerHeight;

		// Calculate actual dimensions
		this.width = containerWidth - this.margin.left - this.margin.right;
		this.height = containerHeight - this.margin.top - this.margin.bottom;

		this.initVis(this.config.parentElement);
	}

	private initVis(parentElement: HTMLElement): void {
		// Create dropdown before SVG
		this.neighbourhoods = Array.from(new Set(this.data.map((d) => d.neighbourhood))).sort();

		this.dropdown = d3
			.select(parentElement)
			.append('select')
			.attr('class', 'neighbourhood-select')
			.style('margin-bottom', '10px')
			.style('padding', '5px')
			.style('width', '200px');

		this.dropdown
			.selectAll('option')
			.data(this.neighbourhoods)
			.enter()
			.append('option')
			.text((d) => d)
			.attr('value', (d) => d)
			.property('selected', (d) => d === this.currentNeighbourhood);

		// Add event listener
		this.dropdown.on('change', (event) => {
			this.currentNeighbourhood = event.target.value;
			this.updateVis();
			if (this.config.onNeighbourhoodChange) {
				this.config.onNeighbourhoodChange(this.currentNeighbourhood);
			}
		});

		// Create SVG
		this.svg = d3
			.select(parentElement)
			.append('svg')
			.attr('width', this.width + this.margin.left + this.margin.right)
			.attr('height', this.height + this.margin.top + this.margin.bottom);

		this.chart = this.svg
			.append('g')
			.attr('transform', `translate(${this.margin.left},${this.margin.top})`);

		// Initialize scales
		this.xScale = d3.scaleTime().range([0, this.width]);
		this.yScale = d3.scaleLinear().range([this.height, 0]);
		this.colorScale = d3.scaleOrdinal(colorSchema);

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
		d3.select('body')
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
		// Filter data for selected neighbourhood
		const filteredData = this.data.filter((d) => d.neighbourhood === this.currentNeighbourhood);

		// Group data by crime type
		const crimeTypes = Array.from(new Set(filteredData.map((d) => d.crime_type)));

		// Clear existing paths
		this.chart.selectAll('.line').remove();

		// Update scales
		this.xScale.domain(d3.extent(filteredData, (d) => new Date(d.year, 0)) as [Date, Date]);
		const maxCrimeRate = d3.max(filteredData, (d) => +d.crime_rate) as number;
		this.yScale.domain([0, maxCrimeRate * 1.1]);
		this.colorScale.domain(crimeTypes);
		console.log('maxCrimeRate', maxCrimeRate);

		// Create line generator
		const line = d3
			.line<CrimeData>()
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
				.attr('d', line)
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
				.ease(d3.easeLinear)
				.attr('stroke-dashoffset', 0)
				.on('end', function () {
					// Remove the dash array after animation completes
					d3.select(this).attr('stroke-dasharray', null);
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
					d3.select(event.currentTarget).attr('r', 7).style('stroke-width', 2);

					d3.select('#crime-tooltip')
						.style('opacity', 1)
						.html(
							`<div class="tooltip-label">
							<strong>${crimeType}</strong><br>
							Year: ${d.year}<br>
							Crime Rate: ${d.crime_rate.toFixed(1)} per 100,000
						</div>`
						)
						.style('left', event.pageX + this.config.tooltipPadding + 'px')
						.style('top', event.pageY + this.config.tooltipPadding + 'px');
				})
				.on('mousemove', (event) => {
					d3.select('#crime-tooltip') // Updated ID
						.style('left', event.pageX + this.config.tooltipPadding + 'px')
						.style('top', event.pageY + this.config.tooltipPadding + 'px');
				})
				.on('mouseout', (event) => {
					d3.select(event.currentTarget).attr('r', 5).style('stroke-width', 1.5);

					d3.select('#crime-tooltip').style('opacity', 0);
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

			return d3
				.axisLeft(this.yScale)
				.tickValues(tickValues)
				.tickFormat((d) => {
					if (d >= 1000) {
						return (d / 1000).toFixed(1) + 'k';
					}
					return d.toFixed(0);
				});
		};

		// Function to update the chart based on active crime types
		const updateChart = () => {
			// Filter data for only active crime types
			const activeData = filteredData.filter((d) => activeCrimeTypes.has(d.crime_type));

			// Recalculate y-axis domain based on active data
			const maxCrimeRate = d3.max(activeData, (d) => +d.crime_rate) as number;
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
					.attr('d', line);

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
				.attr('width', this.config.legendWidth ?? 5)
				.attr('height', this.config.legendHeight ?? 5)
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
		this.xAxis.call(d3.axisBottom(this.xScale));
	}
}
