export interface SoilSample {
  id: string;
  fieldId: string;
  sampleDate: string; // YYYY-MM-DD
  labSampleNumber: string;
  nitrogenPpm: number;
  phosphorusPpm: number;
  potassiumPpm: number;
  organicMatterPct: number;
  ph: number;
  status: 'low' | 'optimal' | 'high';
}

export interface TissueSample {
  id: string;
  fieldId: string;
  sampleDate: string; // YYYY-MM-DD
  nitrogenPct: number;
  phosphorusPct: number;
  potassiumPct: number;
  zincPpm: number;
  status: 'deficient' | 'adequate' | 'excessive';
}

export interface NitrogenPlan {
  id: string;
  fieldId: string;
  cropYear: number;
  budgetedN_lbsPerAcre: number;
  appliedN_lbsPerAcre: number;
  organicN_lbsPerAcre: number;
  irrigationN_lbsPerAcre: number;
  yieldGoalTonsPerAcre: number;
  creditsResidualN_lbsPerAcre: number;
}
