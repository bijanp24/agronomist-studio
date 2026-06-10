import { WeatherSnapshot, IrrigationEvent, SoilMoistureReading } from '../models/water';

export const mockWeatherSnapshots: WeatherSnapshot[] = [
  // Fresno Ranch (r1)
  {
    id: 'w1',
    ranchId: 'r1',
    date: '2026-06-08',
    tempMinF: 62,
    tempMaxF: 95,
    humidityPct: 35,
    windSpeedMph: 8,
    cimisEtoInches: 0.28
  },
  {
    id: 'w2',
    ranchId: 'r1',
    date: '2026-06-09',
    tempMinF: 65,
    tempMaxF: 98,
    humidityPct: 30,
    windSpeedMph: 11,
    cimisEtoInches: 0.31
  },
  // Kern Ranch (r2)
  {
    id: 'w3',
    ranchId: 'r2',
    date: '2026-06-08',
    tempMinF: 66,
    tempMaxF: 99,
    humidityPct: 28,
    windSpeedMph: 12,
    cimisEtoInches: 0.33
  },
  {
    id: 'w4',
    ranchId: 'r2',
    date: '2026-06-09',
    tempMinF: 68,
    tempMaxF: 102,
    humidityPct: 25,
    windSpeedMph: 9,
    cimisEtoInches: 0.35
  }
];

export const mockIrrigationEvents: IrrigationEvent[] = [
  {
    id: 'ie1',
    fieldId: 'f1', // Sierra Almonds - North
    startedAt: '2026-06-07T20:00:00Z',
    endedAt: '2026-06-08T08:00:00Z',
    durationHours: 12,
    appliedInches: 0.45,
    gallonsApplied: 976000,
    status: 'completed'
  },
  {
    id: 'ie2',
    fieldId: 'f2', // Sierra Almonds - South
    startedAt: '2026-06-09T06:00:00Z',
    endedAt: '2026-06-09T18:00:00Z',
    durationHours: 12,
    appliedInches: 0.45,
    gallonsApplied: 1464000,
    status: 'completed'
  },
  {
    id: 'ie3',
    fieldId: 'f4', // Kern Pistachios - West
    startedAt: '2026-06-11T04:00:00Z',
    endedAt: '2026-06-11T22:00:00Z',
    durationHours: 18,
    appliedInches: 0.65,
    gallonsApplied: 2824000,
    status: 'scheduled'
  },
  {
    id: 'ie4',
    fieldId: 'f6', // Sacramento Tomatoes
    startedAt: '2026-06-10T12:00:00Z',
    endedAt: '2026-06-11T00:00:00Z',
    durationHours: 12,
    appliedInches: 0.50,
    gallonsApplied: 1900000,
    status: 'active'
  }
];

export const mockSoilMoistureReadings: SoilMoistureReading[] = [
  {
    id: 'sm1',
    fieldId: 'f1',
    timestamp: '2026-06-09T12:00:00Z',
    depth8InchesPct: 24.5,
    depth16InchesPct: 28.2,
    depth32InchesPct: 31.0,
    averagePct: 27.9
  },
  {
    id: 'sm2',
    fieldId: 'f2',
    timestamp: '2026-06-09T12:00:00Z',
    depth8InchesPct: 18.2,
    depth16InchesPct: 22.1,
    depth32InchesPct: 25.4,
    averagePct: 21.9 // Under-watered
  },
  {
    id: 'sm3',
    fieldId: 'f4',
    timestamp: '2026-06-09T12:00:00Z',
    depth8InchesPct: 14.1,
    depth16InchesPct: 18.0,
    depth32InchesPct: 22.1,
    averagePct: 18.1 // Critical low moisture
  }
];
