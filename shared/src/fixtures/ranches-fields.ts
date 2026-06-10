import { Ranch, Field } from '../models/ranch-field';

export const mockRanches: Ranch[] = [
  {
    id: 'r1',
    name: 'Sierra View Ranch',
    county: 'Fresno',
    totalAcres: 320,
    createdAt: '2023-01-15T08:00:00Z'
  },
  {
    id: 'r2',
    name: 'Kern River Ranch',
    county: 'Kern',
    totalAcres: 640,
    createdAt: '2023-03-20T08:00:00Z'
  },
  {
    id: 'r3',
    name: 'Sacramento Delta Ranch',
    county: 'Yolo',
    totalAcres: 480,
    createdAt: '2023-06-10T08:00:00Z'
  }
];

export const mockFields: Field[] = [
  {
    id: 'f1',
    ranchId: 'r1',
    name: 'Sierra Almonds - North',
    crop: 'Almonds',
    variety: 'Nonpareil',
    areaAcres: 80,
    county: 'Fresno',
    status: 'healthy',
    lastScouted: '2026-06-08T10:30:00Z',
    createdAt: '2023-01-15T09:00:00Z',
    boundaryJson: {
      type: 'Polygon',
      coordinates: [
        [
          [-119.720, 36.810],
          [-119.710, 36.810],
          [-119.710, 36.805],
          [-119.720, 36.805],
          [-119.720, 36.810]
        ]
      ]
    }
  },
  {
    id: 'f2',
    ranchId: 'r1',
    name: 'Sierra Almonds - South',
    crop: 'Almonds',
    variety: 'Monterey',
    areaAcres: 120,
    county: 'Fresno',
    status: 'needs-attention',
    lastScouted: '2026-06-09T09:15:00Z',
    createdAt: '2023-01-15T09:15:00Z',
    boundaryJson: {
      type: 'Polygon',
      coordinates: [
        [
          [-119.720, 36.803],
          [-119.705, 36.803],
          [-119.705, 36.795],
          [-119.720, 36.795],
          [-119.720, 36.803]
        ]
      ]
    }
  },
  {
    id: 'f3',
    ranchId: 'r1',
    name: 'Sierra Grapes - Block A',
    crop: 'Wine Grapes',
    variety: 'Cabernet Sauvignon',
    areaAcres: 60,
    county: 'Fresno',
    status: 'healthy',
    lastScouted: '2026-06-07T14:45:00Z',
    createdAt: '2023-02-10T10:00:00Z',
    boundaryJson: {
      type: 'Polygon',
      coordinates: [
        [
          [-119.700, 36.810],
          [-119.690, 36.810],
          [-119.690, 36.802],
          [-119.700, 36.802],
          [-119.700, 36.810]
        ]
      ]
    }
  },
  {
    id: 'f4',
    ranchId: 'r2',
    name: 'Kern Pistachios - West',
    crop: 'Pistachios',
    variety: 'Kerman',
    areaAcres: 160,
    county: 'Kern',
    status: 'critical',
    lastScouted: '2026-06-05T08:30:00Z',
    createdAt: '2023-03-20T10:00:00Z',
    boundaryJson: {
      type: 'Polygon',
      coordinates: [
        [
          [-119.120, 35.420],
          [-119.100, 35.420],
          [-119.100, 35.410],
          [-119.120, 35.410],
          [-119.120, 35.420]
        ]
      ]
    }
  },
  {
    id: 'f5',
    ranchId: 'r2',
    name: 'Kern Alfalfa - Center Pivot',
    crop: 'Alfalfa',
    variety: 'CUF 101',
    areaAcres: 120,
    county: 'Kern',
    status: 'healthy',
    lastScouted: '2026-06-09T16:00:00Z',
    createdAt: '2023-03-20T11:00:00Z',
    boundaryJson: {
      type: 'Polygon',
      coordinates: [
        [
          [-119.095, 35.420],
          [-119.080, 35.420],
          [-119.080, 35.410],
          [-119.095, 35.410],
          [-119.095, 35.420]
        ]
      ]
    }
  },
  {
    id: 'f6',
    ranchId: 'r3',
    name: 'Sacramento Tomatoes - Field 10',
    crop: 'Processing Tomatoes',
    variety: 'Heinz 1885',
    areaAcres: 140,
    county: 'Yolo',
    status: 'healthy',
    lastScouted: '2026-06-08T09:00:00Z',
    createdAt: '2023-06-10T09:00:00Z',
    boundaryJson: {
      type: 'Polygon',
      coordinates: [
        [
          [-121.910, 38.710],
          [-121.895, 38.710],
          [-121.895, 38.700],
          [-121.910, 38.700],
          [-121.910, 38.710]
        ]
      ]
    }
  },
  {
    id: 'f7',
    ranchId: 'r3',
    name: 'Sacramento Tomatoes - Field 12',
    crop: 'Processing Tomatoes',
    variety: 'Heinz 8504',
    areaAcres: 100,
    county: 'Yolo',
    status: 'needs-attention',
    lastScouted: '2026-06-06T11:30:00Z',
    createdAt: '2023-06-10T09:30:00Z',
    boundaryJson: {
      type: 'Polygon',
      coordinates: [
        [
          [-121.890, 38.710],
          [-121.880, 38.710],
          [-121.880, 38.700],
          [-121.890, 38.700],
          [-121.890, 38.710]
        ]
      ]
    }
  }
];
