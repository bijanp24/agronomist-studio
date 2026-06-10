export interface PestObservation {
  id: string;
  fieldId: string;
  pestName: string; // e.g., Navel Orangeworm, Peach Twig Borer, Two-Spotted Spider Mite
  commonName: string;
  scientificName?: string;
  observedCount: number;
  observationUnit: 'trap-catch' | 'leaf-count' | 'percent-damage';
  status: 'below-threshold' | 'approaching-threshold' | 'above-threshold';
  observedAt: string; // ISO Date
}

export interface SprayRecommendationMaterial {
  tradeName: string;
  epaRegNumber: string;
  ratePerAcre: string; // e.g. "12 oz/ac"
  activeIngredient: string;
  reiHours: number; // Re-entry interval
  phiDays: number; // Pre-harvest interval
}

export interface SprayRecommendation {
  id: string;
  fieldId: string;
  pcaName: string; // Pest Control Advisor
  pcaLicense: string;
  pestTarget: string;
  materials: SprayRecommendationMaterial[];
  waterVolumeGallonsPerAcre: number;
  totalTreatedAcres: number;
  applicationMethod: 'ground' | 'air';
  status: 'draft' | 'approved' | 'applied';
  createdAt: string; // ISO Date
  approvedAt?: string;
  appliedAt?: string;
}

export interface PesticideUseReport {
  id: string;
  fieldId: string;
  recommendationId?: string;
  operatorName: string;
  permitNumber: string;
  countyCode: string; // California DPR County Code
  applicationDate: string; // YYYY-MM-DD
  materialName: string;
  epaRegNumber: string;
  totalAmountApplied: number;
  unit: 'lbs' | 'gals' | 'oz';
  treatedAcres: number;
  status: 'pending-submission' | 'submitted';
  submittedAt?: string;
}
