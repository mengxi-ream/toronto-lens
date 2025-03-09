import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { NeighbourhoodProperties } from './types';

interface TorontoChoroplethConfig {
	parentElement: HTMLElement;
	containerWidth?: number;
	containerHeight?: number;
	margin?: { top: number; right: number; bottom: number; left: number };
	tooltipPadding?: number;
}

interface LegendStop {
	color: string;
	value: number;
	offset: number;
}

type TorontoNeighbourhood = Feature<Geometry, NeighbourhoodProperties>;
type TorontoFeatureCollection = FeatureCollection<Geometry, NeighbourhoodProperties>;

type TorontoGeometry = {
	type: string;
	properties: NeighbourhoodProperties;
	arcs: number[][];
};

interface TorontoTopology extends Topology {
	objects: {
		neighbourhoods: GeometryCollection & {
			type: 'GeometryCollection';
			geometries: TorontoGeometry[];
		};
	};
}

export class RecommendationChart {
	private config: {
		parentElement: HTMLElement;
		containerWidth: number;
		containerHeight: number;
		margin: { top: number; right: number; bottom: number; left: number };
		tooltipPadding: number;
		legendTop: number;
		legendLeft: number;
		legendRectHeight: number;
		legendRectWidth: number;
	};
	private data: TorontoTopology;
	private width: number = 0;
	private height: number = 0;
	private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	private chart!: d3.Selection<SVGGElement, unknown, null, undefined>;
	private projection!: d3.GeoProjection;
	private geoPath!: d3.GeoPath;
	private colorScale!: d3.ScaleLinear<string, string>;
	private linearGradient!: d3.Selection<SVGLinearGradientElement, unknown, null, undefined>;
	private legendGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
	private legendRect!: d3.Selection<SVGRectElement, unknown, null, undefined>;
	private legendTitle!: d3.Selection<SVGTextElement, unknown, null, undefined>;
	private legendStops: LegendStop[] = [];

	constructor(_config: TorontoChoroplethConfig, _data: TorontoTopology) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.containerWidth || 800,
			containerHeight: _config.containerHeight || 600,
			margin: _config.margin || { top: 20, right: 20, bottom: 20, left: 20 },
			tooltipPadding: _config.tooltipPadding || 10,
			legendTop: 60,
			legendLeft: 30,
			legendRectHeight: 12,
			legendRectWidth: 150
		};
		this.data = _data;
		this.initVis();
	}

	private initVis(): void {
		this.width = this.config.containerWidth - this.config.margin.left - this.config.margin.right;
		this.height = this.config.containerHeight - this.config.margin.top - this.config.margin.bottom;

		// Define size of SVG drawing area
		this.svg = d3
			.select(this.config.parentElement)
			.append('svg')
			.attr('width', this.config.containerWidth)
			.attr('height', this.config.containerHeight);

		// Append group element that will contain our actual chart
		this.chart = this.svg
			.append('g')
			.attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

		// Initialize projection and path generator
		this.projection = d3.geoMercator();
		this.geoPath = d3.geoPath().projection(this.projection);

		// Initialize color scale
		this.colorScale = d3
			.scaleLinear<string>()
			.range(['#B2CFFF', '#1664FF'])
			.interpolate(d3.interpolateHcl);

		// Initialize gradient for legend
		this.linearGradient = this.svg
			.append('defs')
			.append('linearGradient')
			.attr('id', 'legend-gradient');

		// Create legend group
		this.legendGroup = this.svg
			.append('g')
			.attr('class', 'legend-group')
			.attr('transform', `translate(${this.config.legendLeft},${this.config.legendTop})`);

		// Append legend elements
		this.legendRect = this.legendGroup
			.append('rect')
			.attr('width', this.config.legendRectWidth)
			.attr('height', this.config.legendRectHeight);

		this.legendTitle = this.legendGroup
			.append('text')
			.attr('class', 'legend-title')
			.attr('dy', '.35em')
			.attr('y', -10)
			.text('Population Density (per km²)');
	}

	public updateVis(): void {
		// Get the extent of population density
		const densities = this.data.objects.neighbourhoods.geometries.map(
			(d: TorontoGeometry) => d.properties.population_density
		);

		const densityExtent = d3.extent(densities) as [number, number];
		if (densityExtent[0] !== undefined && densityExtent[1] !== undefined) {
			// Update color scale
			this.colorScale.domain(densityExtent);

			// Define legend stops
			this.legendStops = [
				{ color: '#B2CFFF', value: densityExtent[0], offset: 0 },
				{ color: '#1664FF', value: densityExtent[1], offset: 100 }
			];
		}

		this.renderVis();
	}

	private renderVis(): void {
		// Convert TopoJSON to GeoJSON
		const neighbourhoods = topojson.feature(
			this.data,
			this.data.objects.neighbourhoods
		) as unknown as TorontoFeatureCollection;

		// Fit projection to data
		this.projection.fitSize([this.width, this.height], neighbourhoods);

		// Draw the map
		const neighbourhoodPath = this.chart
			.selectAll<SVGPathElement, TorontoNeighbourhood>('.neighbourhood')
			.data(neighbourhoods.features)
			.join('path')
			.attr('class', 'neighbourhood')
			.attr('d', this.geoPath)
			.attr('fill', (d) => {
				const density = d.properties.population_density;
				return this.colorScale(density);
			})
			.attr('stroke', '#fff')
			.attr('stroke-width', 0.5);

		// Add tooltips
		neighbourhoodPath
			.on('mousemove', (event: MouseEvent, d: TorontoNeighbourhood) => {
				const density = d.properties.population_density;
				d3
					.select('#tooltip')
					.style('display', 'block')
					.style('left', event.pageX + this.config.tooltipPadding + 'px')
					.style('top', event.pageY + this.config.tooltipPadding + 'px')
					.attr(
						'class',
						'absolute bg-white shadow-md rounded p-2.5 text-xs pointer-events-none z-50'
					).html(`
            <div class="font-bold mb-1">${d.properties.neighbourhood}</div>
            <div><strong>${Math.round(density)}</strong> people per km²</div>
          `);
			})
			.on('mouseleave', () => {
				d3.select('#tooltip').style('display', 'none');
			});

		// Update legend
		if (this.legendStops) {
			this.legendGroup
				.selectAll('.legend-label')
				.data(this.legendStops)
				.join('text')
				.attr('class', 'text-xs fill-gray-700')
				.attr('text-anchor', 'middle')
				.attr('dy', '.35em')
				.attr('y', 20)
				.attr('x', (d, index) => (index === 0 ? 0 : this.config.legendRectWidth))
				.text((d) => Math.round(d.value));

			this.legendTitle.attr('class', 'text-sm fill-gray-800 font-medium');

			this.legendRect.attr('class', 'stroke-gray-300').attr('fill', 'url(#legend-gradient)');

			this.linearGradient
				.selectAll('stop')
				.data(this.legendStops)
				.join('stop')
				.attr('offset', (d) => d.offset + '%')
				.attr('stop-color', (d) => d.color);
		}
	}
}
