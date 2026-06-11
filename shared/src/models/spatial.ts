export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningBlockInput {
  name: string;
  description: string;
  unit: string;
  required?: boolean;
}

export interface LearningBlockOutput {
  name: string;
  description: string;
  unit: string;
}

export interface RecommendationRule {
  condition: string;
  recommendation: string;
}

export interface LearningBlock {
  id: string;
  title: string;
  concept: string;
  formula?: string;
  inputs: LearningBlockInput[];
  outputs: LearningBlockOutput[];
  mapLayers: string[];
  simulationSteps?: string[];
  recommendationRules?: RecommendationRule[];
  difficultyLevel: DifficultyLevel;
  tags?: string[];
}

export type FieldLayerType =
  | 'boundary'
  | 'terrain'
  | 'soil'
  | 'weather'
  | 'crop'
  | 'operations'
  | 'yield'
  | 'custom';

export interface FieldLayerGeometry {
  type: string;
  coordinates: unknown;
}

export interface FieldLayer {
  id: string;
  name: string;
  type: FieldLayerType;
  geometry?: FieldLayerGeometry;
  attributes: Record<string, unknown>;
  /** Human-readable provider name, e.g. "local-demo", "NRCS SSURGO". */
  source?: string;
  /** ISO 8601 timestamp when the layer data was captured or generated. */
  timestamp?: string;
}

export interface QuizQuestion {
  question: string;
  answer: string;
  choices?: string[];
}

export interface LearningModeContent {
  blockId: string;
  beginnerExplanation: string;
  /** Markdown with formula notation. */
  formulaView: string;
  /** Short description of what the map layer shows. */
  mapView?: string;
  simulationView?: string;
  quizQuestions?: QuizQuestion[];
  recommendationExplanation?: string;
}

export interface LearningBlockResult {
  blockId: string;
  computed: Record<string, number>;
  outputLayers: FieldLayer[];
  explanation?: string;
  warning?: string;
}

export const BLOCK_IDS = [
  'boundary-area',
  'terrain-flow',
  'carrying-capacity',
] as const;

export type BlockId = (typeof BLOCK_IDS)[number];

export interface LatLon {
  lat: number;
  lon: number;
}

export interface BoundaryAreaInputs {
  ring: LatLon[];
  unit?: 'acre' | 'hectare';
}

export interface BoundaryAreaResult {
  areaAcres: number;
  areaHectares: number;
  perimeterMiles: number;
  perimeterKm: number;
  vertexCount: number;
}

export interface ElevationGrid {
  values: number[][];
  cellSizeMeters: number;
  originLat: number;
  originLon: number;
}

export interface SlopePoint {
  row: number;
  col: number;
  lat: number;
  lon: number;
  elevationM: number;
  slopePercent: number;
  flowBearing: number;
  isPoolingZone: boolean;
  isRunoffZone: boolean;
}

export interface TerrainFlowResult {
  points: SlopePoint[];
  minSlopePercent: number;
  maxSlopePercent: number;
  avgSlopePercent: number;
  poolingZoneCount: number;
  runoffZoneCount: number;
}

export interface LogisticGrowthInputs {
  initialPopulation: number;
  carryingCapacity: number;
  growthRate: number;
  steps: number;
  stepSize?: number;
}

export interface PopulationStep {
  t: number;
  population: number;
}

export interface LotkaVolterraInputs {
  preyPopulation: number;
  predatorPopulation: number;
  alpha: number;
  beta: number;
  delta: number;
  gamma: number;
  steps: number;
  stepSize?: number;
}

export interface PredatorPreyStep {
  t: number;
  prey: number;
  predator: number;
}

export interface CarryingCapacityInputs {
  mode: 'logistic' | 'predator-prey';
  logistic?: LogisticGrowthInputs;
  lotkaVolterra?: LotkaVolterraInputs;
}
