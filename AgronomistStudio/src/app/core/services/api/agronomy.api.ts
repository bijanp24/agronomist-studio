import { Observable } from 'rxjs';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface EvapotranspirationReading {
  date: string;
  stationId?: string;
  stationName?: string;
  location?: GeoPoint;
  eto: number;
  airTempF?: number;
  solarRadiation?: number;
  precipitation?: number;
  source: string;
}

export interface ForecastEtReading {
  date: string;
  eto: number;
  precipitation?: number;
  maxTempF?: number;
  minTempF?: number;
  source: string;
}

export interface SoilProfile {
  location: GeoPoint;
  mapUnitKey?: string;
  mapUnitName?: string;
  componentName?: string;
  texture?: string;
  drainageClass?: string;
  hydrologicGroup?: string;
  availableWaterCapacity: number;
  rootZoneDepthIn: number;
  source: string;
}

export interface CropWaterCoefficient {
  cropId: string;
  cropName: string;
  category?: string;
  kc: number;
  allowableDepletion?: number;
  rootDepthIn?: number;
  source: string;
}

export interface OpenDataDataset {
  id: string;
  title: string;
  description?: string;
  organization?: string;
  url?: string;
  resourceCount?: number;
  tags?: string[];
  updated?: string;
  source: string;
}

export interface WaterQualityRecord {
  wellId?: string;
  location: GeoPoint;
  county?: string;
  nitrateMgL?: number;
  salinityMgL?: number;
  sampleDate?: string;
  distanceMiles?: number;
  source: string;
}

export interface IrrigationRecommendation {
  cropName: string;
  eto: number;
  kc: number;
  cropEt: number;
  netIrrigationIn: number;
  grossIrrigationIn: number;
  intervalDays: number;
  readilyAvailableWaterIn: number;
  forecastRainIn: number;
  systemEfficiency: number;
  heatRisk: boolean;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}

export interface AgronomyLocationSummary {
  location: GeoPoint;
  county?: string;
  resolvedAt: string;
  evapotranspiration?: EvapotranspirationReading;
  forecast?: ForecastEtReading[];
  soil?: SoilProfile;
  waterQuality?: WaterQualityRecord[];
  datasets?: OpenDataDataset[];
  irrigation?: IrrigationRecommendation;
  warnings?: Record<string, string>;
}

export interface SoilWaterBalance {
  location: GeoPoint;
  availableWaterCapacity: number;
  rootZoneDepthIn: number;
  totalAvailableWaterIn: number;
  readilyAvailableWaterIn: number;
  recentEtIn: number;
  forecastEtIn: number;
  forecastRainIn: number;
  projectedDeficitIn: number;
}

export interface RiskSummary {
  location: GeoPoint;
  heatRisk: boolean;
  droughtStress: boolean;
  waterQualityConcern: boolean;
  notes: string[];
}

export abstract class AgronomyApi {
  abstract getLocationSummary(
    lat: number,
    lon: number,
    cropId?: string,
    cropName?: string,
    efficiency?: number
  ): Observable<AgronomyLocationSummary>;

  abstract getIrrigationRecommendation(
    lat: number,
    lon: number,
    cropId?: string,
    cropName?: string,
    efficiency?: number,
    etoOverride?: number
  ): Observable<IrrigationRecommendation>;

  abstract getSoilWaterBalance(lat: number, lon: number): Observable<SoilWaterBalance>;

  abstract getRiskSummary(lat: number, lon: number): Observable<RiskSummary>;
}
