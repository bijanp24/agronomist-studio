import { PlantingPlan, HarvestRecord, YieldRecord } from '../models/crop-planning';

export const mockPlantingPlans: PlantingPlan[] = [
  {
    id: 'pp1',
    fieldId: 'f6', // Sacramento Tomatoes - Field 10
    cropYear: 2026,
    crop: 'Processing Tomatoes',
    variety: 'Heinz 1885',
    targetPlantingDate: '2026-04-15',
    actualPlantingDate: '2026-04-18',
    targetHarvestDate: '2026-08-20',
    status: 'planted'
  },
  {
    id: 'pp2',
    fieldId: 'f7', // Sacramento Tomatoes - Field 12
    cropYear: 2026,
    crop: 'Processing Tomatoes',
    variety: 'Heinz 8504',
    targetPlantingDate: '2026-04-22',
    actualPlantingDate: '2026-04-23',
    targetHarvestDate: '2026-08-28',
    status: 'planted'
  }
];

export const mockHarvestRecords: HarvestRecord[] = [
  {
    id: 'hr1',
    fieldId: 'f6',
    harvestDate: '2025-08-22',
    cropYear: 2025,
    crop: 'Processing Tomatoes',
    variety: 'Heinz 1885',
    totalYieldAmount: 7280, // tons (approx 52 tons/ac)
    yieldUnit: 'tons',
    qualityGrade: 'Choice',
    operatorName: 'Delta Harvesting Co.'
  }
];

export const mockYieldRecords: YieldRecord[] = [
  {
    id: 'yr1',
    fieldId: 'f1', // Sierra Almonds - North
    cropYear: 2025,
    crop: 'Almonds',
    avgYieldPerAcre: 1.15, // meat tons
    unit: 'tons',
    historicalAverage: 1.10
  },
  {
    id: 'yr2',
    fieldId: 'f4', // Kern Pistachios - West
    cropYear: 2025,
    crop: 'Pistachios',
    avgYieldPerAcre: 1.45,
    unit: 'tons',
    historicalAverage: 1.38
  }
];
