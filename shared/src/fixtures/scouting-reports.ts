import { ScoutingReport } from '../models/scouting';

export const mockScoutingReports: ScoutingReport[] = [
  {
    id: 'sr1',
    fieldId: 'f1', // Sierra Almonds - North
    scouterName: 'John Deere',
    scoutedAt: '2026-06-08T10:30:00Z',
    severity: 'low',
    notes: 'Almonds look excellent. Sizing is uniform. No signs of hull split yet. Minor mites on border rows near dirt road, but predatory beneficials are active.',
    pestObservations: [
      { pestName: 'Pacific Spider Mite', countPerLeaf: 1.2, percentInfestation: 15 },
      { pestName: 'Predatory Thrips (beneficial)', countPerLeaf: 0.8 }
    ],
    cropStage: 'Fruit Development',
    locationPin: {
      type: 'Point',
      coordinates: [-119.715, 36.808]
    }
  },
  {
    id: 'sr2',
    fieldId: 'f2', // Sierra Almonds - South
    scouterName: 'John Deere',
    scoutedAt: '2026-06-09T09:15:00Z',
    severity: 'medium',
    notes: 'Some flagging observed on branches. Investigated and confirmed Peach Twig Borer larvae active in shoots. Suggest checking trap counts and considering a soft chemical treatment if count rises.',
    pestObservations: [
      { pestName: 'Peach Twig Borer', percentInfestation: 8 }
    ],
    cropStage: 'Fruit Development',
    locationPin: {
      type: 'Point',
      coordinates: [-119.712, 36.798]
    }
  },
  {
    id: 'sr3',
    fieldId: 'f4', // Kern Pistachios - West
    scouterName: 'Sara Agronomy',
    scoutedAt: '2026-06-05T08:30:00Z',
    severity: 'high',
    notes: 'Severe Navel Orangeworm (NOW) infestation. Multiple egg masses found on old mummy nuts. Direct damage to fresh green hulls already visible on tree skirts. Heavy pressure. IMMEDIATE spray recommendation required.',
    pestObservations: [
      { pestName: 'Navel Orangeworm', countPerLeaf: 4.5, percentInfestation: 35 }
    ],
    cropStage: 'Shell Hardening',
    locationPin: {
      type: 'Point',
      coordinates: [-119.110, 35.415]
    }
  },
  {
    id: 'sr4',
    fieldId: 'f7', // Sacramento Tomatoes - Field 12
    scouterName: 'Alex Crop',
    scoutedAt: '2026-06-06T11:30:00Z',
    severity: 'medium',
    notes: 'Early Blight (Alternaria solani) lesioning spotted on lower canopy leaves. Spreading slightly due to recent heavy morning dews. Air flow is low. Will need alert on next irrigation cycle to not overwater.',
    pestObservations: [
      { pestName: 'Early Blight', percentInfestation: 12 }
    ],
    cropStage: 'Flowering & Fruit Set',
    locationPin: {
      type: 'Point',
      coordinates: [-121.885, 38.705]
    }
  }
];
