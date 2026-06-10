import { PestObservation, SprayRecommendation, PesticideUseReport } from '../models/pest-pca';

export const mockPestObservations: PestObservation[] = [
  {
    id: 'po1',
    fieldId: 'f1',
    pestName: 'Pacific Spider Mite',
    commonName: 'Webbing Spider Mite',
    scientificName: 'Tetranychus pacificus',
    observedCount: 1.2,
    observationUnit: 'leaf-count',
    status: 'below-threshold',
    observedAt: '2026-06-08T10:30:00Z'
  },
  {
    id: 'po2',
    fieldId: 'f2',
    pestName: 'Peach Twig Borer',
    commonName: 'PTB',
    scientificName: 'Anarsia lineatella',
    observedCount: 8,
    observationUnit: 'percent-damage',
    status: 'approaching-threshold',
    observedAt: '2026-06-09T09:15:00Z'
  },
  {
    id: 'po3',
    fieldId: 'f4',
    pestName: 'Navel Orangeworm',
    commonName: 'NOW',
    scientificName: 'Amyelois transitella',
    observedCount: 35,
    observationUnit: 'percent-damage',
    status: 'above-threshold',
    observedAt: '2026-06-05T08:30:00Z'
  }
];

export const mockSprayRecommendations: SprayRecommendation[] = [
  {
    id: 'rec1',
    fieldId: 'f4', // Kern Pistachios - West
    pcaName: 'Sara Agronomy',
    pcaLicense: 'PCA-88741',
    pestTarget: 'Navel Orangeworm',
    materials: [
      {
        tradeName: 'Altacor',
        epaRegNumber: '279-9611',
        ratePerAcre: '4.0 oz/ac',
        activeIngredient: 'Chlorantraniliprole',
        reiHours: 4,
        phiDays: 14
      }
    ],
    waterVolumeGallonsPerAcre: 100,
    totalTreatedAcres: 160,
    applicationMethod: 'ground',
    status: 'approved',
    createdAt: '2026-06-05T10:00:00Z',
    approvedAt: '2026-06-06T08:00:00Z'
  },
  {
    id: 'rec2',
    fieldId: 'f2', // Sierra Almonds - South
    pcaName: 'Bill PestControl',
    pcaLicense: 'PCA-77612',
    pestTarget: 'Peach Twig Borer',
    materials: [
      {
        tradeName: 'Intrepid 2F',
        epaRegNumber: '62719-442',
        ratePerAcre: '12.0 oz/ac',
        activeIngredient: 'Methoxyfenozide',
        reiHours: 4,
        phiDays: 14
      }
    ],
    waterVolumeGallonsPerAcre: 150,
    totalTreatedAcres: 120,
    applicationMethod: 'ground',
    status: 'draft',
    createdAt: '2026-06-09T11:00:00Z'
  }
];

export const mockPesticideUseReports: PesticideUseReport[] = [
  {
    id: 'pur1',
    fieldId: 'f4',
    recommendationId: 'rec1',
    operatorName: 'AgSpray Operators LLC',
    permitNumber: 'KERN-34-99812',
    countyCode: '15', // Kern
    applicationDate: '2026-06-08',
    materialName: 'Altacor',
    epaRegNumber: '279-9611',
    totalAmountApplied: 640, // 4 oz * 160 ac
    unit: 'oz',
    treatedAcres: 160,
    status: 'submitted',
    submittedAt: '2026-06-09T16:00:00Z'
  }
];
