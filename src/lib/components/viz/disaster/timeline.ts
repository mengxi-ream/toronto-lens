import type { DisasterCategory, DisasterData, TimelineConfig } from '$lib/types/disaster';
import type { NumberValue } from 'd3';
import * as d3 from 'd3';

export class Timeline {
	private config: Required<TimelineConfig>;
	private data: DisasterData[];
	private selectedCategories: DisasterCategory[];
	private readonly categoryColorSchema: Record<DisasterCategory, string>;
	private readonly categoryLabelSchema: Record<DisasterCategory, string>;

	private width: number;
	private height: number;
	private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	private chartArea: d3.Selection<SVGGElement, unknown, null, undefined>;
	private chart: d3.Selection<SVGGElement, unknown, null, undefined>;
	private xScale: d3.ScaleTime<number, number>;
	private yScale: d3.ScaleLinear<number, number>;
	private radiusScale: d3.ScalePower<number, number>;
	private xAxis: d3.Axis<Date | NumberValue>;
	private yAxis: d3.Axis<NumberValue>;
	private xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	private yAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private arcGenerator: d3.Arc<any, number>;
	private legendItems!: d3.Selection<
		d3.BaseType | HTMLDivElement,
		[string, string],
		HTMLDivElement,
		unknown
	>;
	private filteredData!: DisasterData[];

	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 * @param {Array}
	 */
	constructor(config: TimelineConfig, data: DisasterData[]) {
		this.config = {
			parentElement: config.parentElement,
			containerWidth: config.containerWidth ?? 800,
			containerHeight: config.containerHeight ?? 900,
			tooltipPadding: config.tooltipPadding ?? 15,
			margin: config.margin ?? { top: 120, right: 20, bottom: 20, left: 45 },
			legendWidth: config.legendWidth ?? 170,
			legendHeight: config.legendHeight ?? 8,
			legendRadius: config.legendRadius ?? 5
		};
		this.data = data;
		this.selectedCategories = [];
		this.categoryColorSchema = {
			'winter-storm-freeze': '#ccc',
			'drought-wildfire': '#ffffd9',
			flooding: '#41b6c4',
			'tropical-cyclone': '#081d58',
			'severe-storm': '#c7e9b4'
		};
		this.categoryLabelSchema = {
			'winter-storm-freeze': 'Winter storms, freezing',
			'drought-wildfire': 'Drought and wildfire',
			flooding: 'Flooding',
			'tropical-cyclone': 'Tropical cyclone',
			'severe-storm': 'Severe storm'
		};

		this.width = this.config.containerWidth - this.config.margin.left - this.config.margin.right;
		this.height = this.config.containerHeight - this.config.margin.top - this.config.margin.bottom;

		this.xScale = d3.scaleTime().range([0, this.width]);

		this.xAxis = d3
			.axisTop(this.xScale)
			.ticks(d3.timeMonth)
			.tickFormat((d) => d3.timeFormat('%b')(d as Date))
			.tickSize(-10);

		this.yScale = d3.scaleLinear().range([this.height, 0]);

		this.yAxis = d3
			.axisLeft(this.yScale)
			.tickFormat(d3.format('d'))
			.tickSize(-this.width)
			.tickPadding(15);

		this.radiusScale = d3.scaleSqrt().range([4, 120]);

		// Initialize arc generator that we use to create the SVG path for the half circles.
		this.arcGenerator = d3
			.arc<number>()
			.outerRadius((d) => this.radiusScale(d))
			.innerRadius(0)
			.startAngle(-Math.PI / 2)
			.endAngle(Math.PI / 2);

		// Define size of SVG drawing area
		this.svg = d3
			.select(this.config.parentElement)
			.append('svg')
			.attr('width', this.config.containerWidth)
			.attr('height', this.config.containerHeight);

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		this.chartArea = this.svg
			.append('g')
			.attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

		this.xAxisGroup = this.chartArea
			.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0,-30)`);
		this.yAxisGroup = this.chartArea.append('g').attr('class', 'y axis');

		// Initialize clipping mask that covers the whole chart
		this.chartArea
			.append('defs')
			.append('clipPath')
			.attr('id', 'chart-mask')
			.append('rect')
			.attr('width', this.width)
			.attr('y', -this.config.margin.top)
			.attr('height', this.config.containerHeight);

		// Apply clipping mask to 'this.chart' to clip semicircles at the very beginning and end of a year
		this.chart = this.chartArea.append('g').attr('clip-path', 'url(#chart-mask)');

		this.renderLegend();
	}

	/**
	 * Prepare the data and scales before we render it.
	 */
	public updateVis(): void {
		// Filter data based on selected categories
		const filteredData =
			this.selectedCategories.length === 0
				? this.data
				: this.data.filter((d) => this.selectedCategories.includes(d.category));

		this.xScale.domain([new Date(2000, 0, 1), new Date(2000, 11, 31)]);

		const minYear = d3.min(this.data, (d) => d.year) ?? 2000;
		const maxYear = d3.max(this.data, (d) => d.year) ?? 2000;
		const allYears = d3.range(minYear, maxYear + 1);
		this.yScale.domain([minYear, maxYear]);
		this.yAxis.tickValues(allYears);

		const maxCost = d3.max(this.data, (d) => d.cost) ?? 0;
		const minCost = d3.min(this.data, (d) => d.cost) ?? 0;
		this.radiusScale.domain([minCost, maxCost]);

		// Update the data reference for rendering
		this.filteredData = filteredData;

		this.renderVis();
	}

	/**
	 * Bind data to visual elements (enter-update-exit) and update axes
	 */
	private renderVis(): void {
		this.xAxisGroup.call(this.xAxis).select('.domain').remove();
		this.yAxisGroup.call(this.yAxis).select('.domain').remove();

		const yearGroups = d3.groups(this.filteredData, (d) => d.year);

		const yearGroup = this.chart
			.selectAll('.year-group')
			.data(yearGroups)
			.join('g')
			.attr('class', 'year-group')
			.attr('transform', (d) => `translate(0,${this.yScale(d[0])})`);

		const disasterGroup = yearGroup
			.selectAll('.disaster-group')
			.data((d) => d[1])
			.join('g')
			.attr('class', 'disaster-group')
			.attr('transform', (d) => `translate(${this.xScale(d.standardizedDate)},0)`);

		disasterGroup
			.selectAll('.disaster-path')
			.data((d) => [d])
			.join('path')
			.attr('class', 'disaster-path')
			.attr('d', (d) => this.arcGenerator(d.cost))
			.attr('fill', (d) => this.categoryColorSchema[d.category])
			.attr('fill-opacity', 0.6)
			.attr('stroke', '#333')
			.attr('stroke-width', 0.3);

		const tooltip = d3
			.select(this.config.parentElement)
			.selectAll('.tooltip')
			.attr('class', 'tooltip')
			.data([null])
			.join('div')
			.attr(
				'class',
				'absolute p-2.5 bg-white border border-gray-200 text-xs pointer-events-none opacity-0 shadow-sm'
			);

		disasterGroup
			.selectAll<SVGPathElement, DisasterData>('.disaster-path')
			.on('mouseover', (event: MouseEvent, d) => {
				const element = event.currentTarget as SVGPathElement;

				d3.select(element).attr('stroke-width', 1);
				d3.select(element).attr('fill-opacity', 0.8);

				tooltip
					.style('opacity', 1)
					.html(
						`
            ${d.name}<br/>
            <strong>$${d.cost.toFixed(1)} billion</strong>
          `
					)
					.style('left', event.pageX + this.config.tooltipPadding + 'px')
					.style('top', event.pageY + this.config.tooltipPadding + 'px');
			})
			.on('mousemove', (event: MouseEvent) => {
				tooltip
					.style('left', event.pageX + this.config.tooltipPadding + 'px')
					.style('top', event.pageY + this.config.tooltipPadding + 'px');
			})
			.on('mouseleave', (event: MouseEvent) => {
				const element = event.currentTarget as SVGPathElement;
				d3.select(element).attr('stroke-width', 0.3);
				d3.select(element).attr('fill-opacity', 0.6);
				tooltip.style('opacity', 0);
			});

		yearGroup.each((yearData, idx, groups) => {
			const disasters = yearData[1];
			const maxCost = d3.max(disasters, (d) => d.cost);
			const costliestDisasters = disasters.filter((d) => d.cost === maxCost);
			console.log(costliestDisasters);

			d3.select(groups[idx])
				.selectAll('.disaster-label')
				.data(costliestDisasters)
				.join('text')
				.attr('class', 'disaster-label')
				.attr('class', 'fill-[rgb(54,54,54)] text-[8px]')
				.attr('text-anchor', 'middle')
				.attr('transform', (d) => `translate(${this.xScale(d.standardizedDate)},9)`)
				.text((d) => d.name);
		});
	}

	private renderLegend(): void {
		const legendContainer = d3
			.select(this.config.parentElement)
			.insert('div', ':first-child')
			.attr('class', 'legend')
			.attr('class', 'grid grid-cols-2 gap-x-9 top-0 left-1.5 mt-6');

		// Create legend items
		const legendItems = legendContainer
			.selectAll('.legend-item')
			.data(Object.entries(this.categoryColorSchema))
			.join('div')
			.attr('class', 'legend-item')
			.attr('class', 'flex items-center mb-2 -mt-1 cursor-pointer text-[10px]')
			.on('click', (_event, d) => {
				const category = d[0] as DisasterCategory;
				const index = this.selectedCategories.indexOf(category);

				if (index === -1) {
					if (this.selectedCategories.length === 0) {
						this.selectedCategories = [category];
					} else {
						this.selectedCategories.push(category);
					}
				} else {
					this.selectedCategories.splice(index, 1);
				}

				this.updateLegendStyles();
				this.updateVis();
			});

		legendItems
			.append('div')
			.attr('class', 'legend-item-color')
			.attr('class', 'w-2.5 h-2.5 rounded-full border border-[#6b6b6b] mr-2')
			.style('background-color', (d) => d[1]);

		legendItems.append('span').text((d) => {
			const category = d[0] as DisasterCategory;
			return this.categoryLabelSchema[category];
		});

		this.legendItems = legendItems;
		this.updateLegendStyles();
	}

	private updateLegendStyles(): void {
		this.legendItems.style('opacity', (d) => {
			if (this.selectedCategories.length === 0) return 1;
			return this.selectedCategories.includes(d[0] as DisasterCategory) ? 1 : 0.5;
		});
	}
}
