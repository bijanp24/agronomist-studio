export interface WeatherSnapshot {
  id: string;
  ranchId: string;
  date: string; // YYYY-MM-DD
  tempMinF: number;
  tempMaxF: number;
  humidityPct: number;
  windSpeedMph: number;
  cimisEtoInches: number; // CIMIS reference evapotranspiration
}

export interface IrrigationEvent {
  id: string;
  fieldId: string;
  startedAt: string; // ISO Date
  endedAt: string; // ISO Date
  durationHours: number;
  appliedInches: number; // equivalent inches of water applied
  gallonsApplied: number;
  status: 'scheduled' | 'active' | 'completed';
}

export interface SoilMoistureReading {
  id: string;
  fieldId: string;
  timestamp: string; // ISO Date
  depth8InchesPct: number; // moisture % at 8" depth
  depth16InchesPct: number; // moisture % at 16" depth
  depth32InchesPct: number; // moisture % at 32" depth
  averagePct: number;
}
