export interface PlantingPlan {
  id: string;
  fieldId: string;
  cropYear: number;
  crop: string;
  variety?: string;
  targetPlantingDate: string; // YYYY-MM-DD
  actualPlantingDate?: string; // YYYY-MM-DD
  targetHarvestDate: string; // YYYY-MM-DD
  status: 'planned' | 'planted' | 'harvested' | 'cancelled';
}

export interface HarvestRecord {
  id: string;
  fieldId: string;
  harvestDate: string; // YYYY-MM-DD
  cropYear: number;
  crop: string;
  variety?: string;
  totalYieldAmount: number;
  yieldUnit: 'tons' | 'lbs' | 'bins';
  qualityGrade?: string; // e.g. "Select", "Choice", "Standard"
  operatorName: string;
}

export interface YieldRecord {
  id: string;
  fieldId: string;
  cropYear: number;
  crop: string;
  avgYieldPerAcre: number;
  unit: 'tons' | 'lbs';
  historicalAverage?: number;
}
