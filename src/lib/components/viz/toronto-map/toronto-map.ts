import { selectedCountry, selectedNeighbourhood } from '$lib/stores/map';
import {
	geoMercator,
	geoPath,
	interpolateHcl,
	scaleLinear,
	select,
	type GeoPath,
	type GeoProjection,
	type Selection
} from 'd3';
import merge from 'deepmerge';
import type { FeatureCollection, GeoJsonProperties } from 'geojson';
import type { Feature } from 'geojson';
import type { Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { get } from 'svelte/store';
import { colorSchema, sequentialColorSchema } from '$lib/utils/colorSchema';
import type { TorontoMapConfig } from '$lib/types/chart/layout';
import { findOptimalCenterPoint } from '$lib/utils/map';
import type { NeighbourhoodData } from '$lib/types/data/neighbourhood';
import { base } from '$app/paths';

const defaultConfig: Required<TorontoMapConfig> = {
	projectionFunc: geoMercator,
	margin: { top: 10, right: 10, bottom: 10, left: 10 },
	tooltip: {
		padding: 10
	},
	centerPoint: {
		precision: 0.0000001,
		show: false,
		radius: 3,
		color: '#523'
	}
};

// 定义简化的 TopoJSON 类型
interface TopoData extends Topology {
	objects: {
		[key: string]: GeometryCollection;
	};
}

type GeoFeature = Feature<Geometry, GeoJsonProperties>;

export class TorontoMap {
	private config: Required<TorontoMapConfig>;
	private parentElement: HTMLElement;
	private data: Map<string, NeighbourhoodData>;
	private width: number;
	private height: number;
	private svg: Selection<SVGSVGElement, unknown, null, undefined>;
	private mapG: Selection<SVGGElement, unknown, null, undefined>;
	private projection: GeoProjection;
	private path: GeoPath;
	private topoData: TopoData | null = null;
	private geoData: FeatureCollection | null = null;
	private centerPoints: Map<string, [number, number]> = new Map();
	private colorScale: d3.ScaleLinear<string, string> = scaleLinear<string, string>();

	constructor(
		parentElement: HTMLElement,
		data: NeighbourhoodData[],
		config: TorontoMapConfig = defaultConfig
	) {
		this.config = merge(defaultConfig, config);
		this.parentElement = parentElement;
		this.data = new Map(data.map((d) => [d.neighbourhood, d]));

		const containerRect = this.parentElement.getBoundingClientRect();
		this.width = containerRect.width - this.config.margin.left - this.config.margin.right;
		this.height = containerRect.height - this.config.margin.top - this.config.margin.bottom;

		const container = select(this.parentElement);
		this.svg = container
			.append('svg')
			.attr('width', containerRect.width)
			.attr('height', containerRect.height);
		this.mapG = this.svg
			.append('g')
			.attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

		this.projection = this.config.projectionFunc();
		this.path = geoPath().projection(this.projection);

		this.colorScale = scaleLinear<string>()
			.range([sequentialColorSchema[100], sequentialColorSchema[600]])
			.interpolate(interpolateHcl);
	}

	async loadMap(): Promise<boolean> {
		try {
			const response = await fetch(`${base}/data/original/neighbourhoods.json`);
			this.topoData = await response.json();

			if (this.projection && this.topoData) {
				const objectKey = Object.keys(this.topoData.objects)[0];
				this.geoData = feature(this.topoData, this.topoData.objects[objectKey]);
				if (this.geoData) {
					this.projection.fitSize([this.width, this.height], this.geoData);
					this.geoData.features.forEach((d) => {
						this.centerPoints.set(
							d.properties?.neighbourhood ?? '',
							findOptimalCenterPoint(d, this.config.centerPoint.precision)
						);
					});
				}
			}

			return !!this.geoData;
		} catch (error) {
			console.error('Load TopoJSON map data error:', error);
			return false;
		}
	}

	public resize(width: number, height: number) {
		this.width = width - this.config.margin.left - this.config.margin.right;
		this.height = height - this.config.margin.top - this.config.margin.bottom;

		this.svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
		this.updateVis();
	}

	public async updateVis() {
		await this.loadMap();

		const maxPopulationDensity = Math.max(
			...Array.from(this.data.values()).map((d) => d.population_density)
		);
		const minPopulationDensity = Math.min(
			...Array.from(this.data.values()).map((d) => d.population_density)
		);

		this.colorScale.domain([minPopulationDensity, maxPopulationDensity]);

		this.renderVis();
	}

	private renderVis() {
		if (!this.topoData || !this.geoData) return;

		const sortedFeatures = [...this.geoData.features].sort((a, b) => {
			const aIsSelected = a.properties?.neighbourhood === get(selectedNeighbourhood);
			const bIsSelected = b.properties?.neighbourhood === get(selectedNeighbourhood);
			return aIsSelected ? 1 : bIsSelected ? -1 : 0;
		});

		const tooltip = select(this.parentElement)
			.selectAll('.tooltip')
			.data([null])
			.join('div')
			.attr(
				'class',
				'tooltip absolute p-2 z-50 bg-white border border-gray-200 text-xs pointer-events-none opacity-0 shadow-sm'
			);

		this.mapG
			.selectAll<SVGPathElement, GeoFeature>('.neighbourhood')
			.data(sortedFeatures)
			.join('path')
			.attr('class', 'neighbourhood')
			.attr('d', (d) => this.path(d))
			.attr('fill', (d) =>
				this.colorScale(this.data.get(d.properties?.neighbourhood)?.population_density ?? 0)
			)
			.attr('stroke', (d) => {
				return d.properties?.neighbourhood === get(selectedNeighbourhood) ? colorSchema[2] : '#fff';
			})
			.attr('stroke-width', 0.5)
			.on('mousedown', (_event, d) => {
				const name = d.properties?.neighbourhood;
				if (!name) return;

				selectedNeighbourhood.update((value) => {
					if (value === name) {
						return null;
					} else {
						selectedCountry.set(null);
						return name;
					}
				});
			})
			.on('mouseover', (event, d) => {
				const neighbourhoodName = d.properties?.neighbourhood;
				const density = this.data.get(neighbourhoodName)?.population_density;

				tooltip
					.style('opacity', 1)
					.html(
						`${neighbourhoodName}<br><strong>Population Density:</strong> ${density ? density.toFixed(2) : 'N/A'}`
					)
					.style('left', event.layerX + this.config.tooltip.padding + 'px')
					.style('top', event.layerY + this.config.tooltip.padding + 'px');
			})
			.on('mousemove', (event) => {
				tooltip
					.style('left', event.layerX + this.config.tooltip.padding + 'px')
					.style('top', event.layerY + this.config.tooltip.padding + 'px');
			})
			.on('mouseleave', () => {
				tooltip.style('opacity', 0);
			});

		this.mapG
			.selectAll<SVGCircleElement, GeoFeature>('.neighourhood-center')
			.data(this.config.centerPoint.show ? this.geoData.features : [])
			.join('circle')
			.attr('class', 'neighourhood-center')
			.attr('r', this.config.centerPoint.radius)
			.attr('fill', this.config.centerPoint.color)
			.attr('transform', (d) => {
				const centerPoint = findOptimalCenterPoint(d, this.config.centerPoint.precision);
				const projectedPoint = this.projection(centerPoint);
				return projectedPoint ? `translate(${projectedPoint[0]},${projectedPoint[1]})` : '';
			});
	}

	public getCenterPosition(name: string): [number, number] | null {
		if (name === 'City of Toronto') {
			return [this.width / 2, this.height];
		}
		const centerPoint = this.centerPoints.get(name);
		if (!centerPoint) return null;
		const projectedPoint = this.projection(centerPoint);
		return projectedPoint
			? [projectedPoint[0] + this.config.margin.left, projectedPoint[1] + this.config.margin.top]
			: null;
	}
}
