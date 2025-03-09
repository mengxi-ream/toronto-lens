import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';

export interface NeighbourhoodProperties {
	neighbourhood: string;
	population_density: number;
}

export type TorontoNeighbourhood = Feature<Geometry, NeighbourhoodProperties>;
export type TorontoFeatureCollection = FeatureCollection<Geometry, NeighbourhoodProperties>;

export type TorontoGeometry = {
	type: string;
	properties: NeighbourhoodProperties;
	arcs: number[][];
};

export interface TorontoTopology extends Topology {
	objects: {
		neighbourhoods: GeometryCollection & {
			type: 'GeometryCollection';
			geometries: TorontoGeometry[];
		};
	};
}
