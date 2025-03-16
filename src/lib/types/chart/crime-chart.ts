import type { LayoutConfig } from './base';

export interface CrimeRateConfig extends LayoutConfig {
	tooltipPadding?: number;
	legendWidth?: number;
	legendHeight?: number;
	legendRadius?: number;
	onNeighbourhoodChange?: (neighbourhood: string) => void;
}
