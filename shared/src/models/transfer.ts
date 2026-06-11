export interface Organization {
  id: string;
  name: string;
  type: 'customer' | 'grower' | 'retailer' | 'advisor' | 'cooperative' | 'research';
}

export interface Farm {
  id: string;
  organizationId: string;
  name: string;
  region?: string;
}

export interface AreaValue {
  value: number;
  unit: 'acre' | 'hectare';
}

export interface TransferField {
  id: string;
  farmId: string;
  name: string;
  boundary?: GeoJsonGeometry;
  area?: AreaValue;
  /** Original raw record preserved alongside the normalised record. */
  rawSourceId?: string;
  sourceSystem?: string;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface CropSeason {
  id: string;
  fieldId: string;
  cropYear: number;
  cropName: string;
  variety?: string;
}

export interface TransferMeasurement {
  name: string;
  value: number;
  unit: string;
}

export type OperationType =
  | 'planting'
  | 'harvest'
  | 'irrigation'
  | 'fertilizer'
  | 'chemical'
  | 'tillage'
  | 'scouting'
  | 'soil_sample'
  | 'recommendation'
  | 'other';

export interface FieldOperation {
  id: string;
  fieldId: string;
  seasonId?: string;
  operationType: OperationType;
  date: string;
  sourceSystem?: string;
  rawSourceId?: string;
  measurements: TransferMeasurement[];
  notes?: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  canonicalField: string;
}

export interface UnitConversion {
  fieldName: string;
  detectedUnit: string;
  targetUnit: string;
  conversionFactor: number;
}

export interface ValidationError {
  row: string | number;
  field: string;
  message: string;
}

export interface ParsedCsvRow {
  [column: string]: string;
}

export interface GeoJsonFeature {
  type: string;
  id?: string;
  properties?: Record<string, unknown>;
  geometry: GeoJsonGeometry;
}

export interface GeoJsonFeatureCollection {
  type: string;
  features: GeoJsonFeature[];
}

export interface ImportSession {
  importId: string;
  sourceSystem: string;
  status: 'pending' | 'validated' | 'committed' | 'failed';
  created: number;
  updated: number;
  skipped: number;
  conflicted: number;
  errors: ValidationError[];
  organizations: Organization[];
  farms: Farm[];
  fields: Partial<TransferField>[];
  cropSeasons: Partial<CropSeason>[];
  operations: Partial<FieldOperation>[];
}
