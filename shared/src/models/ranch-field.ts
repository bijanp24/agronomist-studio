import { PolygonGeometry } from './geojson';

export interface Ranch {
  id: string;
  name: string;
  ownerId?: string;
  county: string; // e.g. Fresno, Kern, Yolo
  totalAcres: number;
  createdAt: string;
}

export interface Field {
  id: string;
  ranchId: string;
  name: string;
  crop: string; // e.g., Almonds, Pistachios, Processing Tomatoes, Alfalfa, Wine Grapes
  variety?: string; // e.g., Nonpareil, Golden Hills, Heinz 1885
  areaAcres: number;
  county: string;
  status: 'healthy' | 'needs-attention' | 'critical';
  lastScouted?: string; // ISO Date
  boundaryJson?: PolygonGeometry; // GeoJSON Polygon
  createdAt: string;
}
