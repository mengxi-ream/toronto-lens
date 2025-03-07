import * as d3 from 'd3';

const customColors = [
	'#1664FF',
	'#1AC6FF',
	'#FF8A00',
	'#3CC780',
	'#7442D4',
	'#FFC400',
	'#304D77',
	'#B48DEB',
	'#009488',
	'#FF7DDA'
];

interface CrimeData {
	year: number;
	crime_type: string;
	crime_rate: number;
}

export interface CrimeRateConfig {
	parentElement: HTMLElement;
	containerWidth?: number;
	containerHeight?: number;
	margin?: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	legendWidth?: number;
	legendHeight?: number;
	legendRadius?: number;
	tooltipPadding?: number;
}

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

	constructor(config: CrimeRateConfig, data: CrimeData[]) {
		this.config = {
			parentElement: config.parentElement,
			containerWidth: config.containerWidth ?? 600,
			containerHeight: config.containerHeight ?? 300,
			tooltipPadding: config.tooltipPadding ?? 15,
			margin: config.margin ?? { top: 120, right: 20, bottom: 20, left: 45 },
			legendWidth: config.legendWidth ?? 5,
			legendHeight: config.legendHeight ?? 5,
			legendRadius: config.legendRadius ?? 5
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
		this.colorScale = d3.scaleOrdinal(customColors);

		// Initialize axes
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
	}

	public updateVis(): void {
		// Group data by crime type
		const crimeTypes = Array.from(new Set(this.data.map((d) => d.crime_type)));

		// Update scales
		this.xScale.domain(d3.extent(this.data, (d) => new Date(d.year, 0)) as [Date, Date]);
		const maxCrimeRate = d3.max(this.data, (d) => +d.crime_rate) as number;
		this.yScale.domain([0, maxCrimeRate * 1.1]);
		this.colorScale.domain(crimeTypes);
		console.log('maxCrimeRate', maxCrimeRate);

		// Create line generator
		const line = d3
			.line<CrimeData>()
			.x((d) => this.xScale(new Date(d.year, 0)))
			.y((d) => this.yScale(+d.crime_rate));

		// Draw lines
		crimeTypes.forEach((crimeType) => {
			const crimeData = this.data.filter((d) => d.crime_type === crimeType);

			this.chart
				.append('path')
				.datum(crimeData)
				.attr('class', 'line')
				.attr('d', line)
				.style('fill', 'none')
				.style('stroke', this.colorScale(crimeType))
				.style('stroke-width', 2);
		});

		// Add legend
		const legend = this.chart
			.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${this.width + 10}, 0)`);

		crimeTypes.forEach((crimeType, i) => {
			const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

			legendRow
				.append('rect')
				.attr('width', this.config.legendWidth ?? 5)
				.attr('height', this.config.legendHeight ?? 5)
				.style('fill', this.colorScale(crimeType));

			legendRow
				.append('text')
				.attr('x', 20)
				.attr('y', 10)
				.style('font-size', '12px')
				.text(crimeType);
		});

		// Update axes
		this.xAxis.call(d3.axisBottom(this.xScale));
		this.yAxis.call(d3.axisLeft(this.yScale));
	}
}
