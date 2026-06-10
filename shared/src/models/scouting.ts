import { PointGeometry } from './geojson';

export interface PestObservationSummary {
  pestName: string;
  countPerLeaf?: number;
  percentInfestation?: number;
}

export interface ScoutingReport {
  id: string;
  fieldId: string;
  scouterName: string;
  scoutedAt: string; // ISO Date
  severity: 'low' | 'medium' | 'high';
  notes: string;
  pestObservations: PestObservationSummary[];
  cropStage: string; // e.g. Bloom, Nut Fill, Fruit Development
  locationPin?: PointGeometry; // GeoJSON Point of where report was taken
  images?: string[]; // mock filenames/placeholder urls
}
