import { SoilSample, TissueSample, NitrogenPlan } from '../models/nutrients';

export const mockSoilSamples: SoilSample[] = [
  {
    id: 'ss1',
    fieldId: 'f1',
    sampleDate: '2026-03-10',
    labSampleNumber: 'LAB-FRESNO-9912',
    nitrogenPpm: 12,
    phosphorusPpm: 28,
    potassiumPpm: 145,
    organicMatterPct: 1.8,
    ph: 6.8,
    status: 'optimal'
  },
  {
    id: 'ss2',
    fieldId: 'f4',
    sampleDate: '2026-03-12',
    labSampleNumber: 'LAB-KERN-8823',
    nitrogenPpm: 6, // Low nitrogen in soil
    phosphorusPpm: 18,
    potassiumPpm: 98,
    organicMatterPct: 1.1,
    ph: 7.4,
    status: 'low'
  }
];

export const mockTissueSamples: TissueSample[] = [
  {
    id: 'ts1',
    fieldId: 'f1',
    sampleDate: '2026-05-15',
    nitrogenPct: 2.3,
    phosphorusPct: 0.22,
    potassiumPct: 1.45,
    zincPpm: 18,
    status: 'deficient' // zinc deficient
  },
  {
    id: 'ts2',
    fieldId: 'f2',
    sampleDate: '2026-05-15',
    nitrogenPct: 2.1,
    phosphorusPct: 0.18,
    potassiumPct: 1.22,
    zincPpm: 24,
    status: 'adequate'
  }
];

export const mockNitrogenPlans: NitrogenPlan[] = [
  {
    id: 'np1',
    fieldId: 'f1',
    cropYear: 2026,
    budgetedN_lbsPerAcre: 200,
    appliedN_lbsPerAcre: 120,
    organicN_lbsPerAcre: 20,
    irrigationN_lbsPerAcre: 15,
    yieldGoalTonsPerAcre: 1.2, // almonds meat tons
    creditsResidualN_lbsPerAcre: 30
  },
  {
    id: 'np2',
    fieldId: 'f4',
    cropYear: 2026,
    budgetedN_lbsPerAcre: 150,
    appliedN_lbsPerAcre: 60,
    organicN_lbsPerAcre: 0,
    irrigationN_lbsPerAcre: 10,
    yieldGoalTonsPerAcre: 1.5,
    creditsResidualN_lbsPerAcre: 15
  }
];
