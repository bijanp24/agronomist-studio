import { fetchJson, type Logger } from './http';
import type { CimisStation, EvapotranspirationReading, GeoPoint } from './models';

const CIMIS_BASE = 'https://et.water.ca.gov/api';
const DATA_ITEMS = 'day-asce-eto,day-precip,day-sol-rad-avg,day-air-tmp-avg,day-air-tmp-max,day-air-tmp-min';

export function getCimisAppKey(): string | undefined {
  return process.env.CIMIS_APP_KEY ?? process.env.CIMIS_APPKEY;
}

// --- raw CIMIS response shapes ------------------------------------------------

interface CimisDataItem {
  Value: string | null;
  Qc?: string;
  Unit?: string;
}

interface CimisRecord {
  Date: string;
  Julian?: string;
  Station?: string;
  Standard?: string;
  Scope?: string;
  DayAsceEto?: CimisDataItem;
  DayPrecip?: CimisDataItem;
  DaySolRadAvg?: CimisDataItem;
  DayAirTmpAvg?: CimisDataItem;
  DayAirTmpMax?: CimisDataItem;
  DayAirTmpMin?: CimisDataItem;
}

interface CimisProvider {
  Name?: string;
  Type?: string;
  Records?: CimisRecord[];
}

interface CimisDataResponse {
  Data?: { Providers?: CimisProvider[] };
}

interface CimisRawStation {
  StationNbr: string;
  Name: string;
  City?: string;
  County?: string | null;
  IsActive?: string;
  IsEtoStation?: string;
  Elevation?: string;
  HmsLatitude?: string;
  HmsLongitude?: string;
}

interface CimisStationResponse {
  Stations?: CimisRawStation[];
}

// --- helpers ------------------------------------------------------------------

function num(item?: CimisDataItem): number | undefined {
  if (!item || item.Value === null || item.Value === undefined || item.Value === '') return undefined;
  const n = Number(item.Value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse the decimal degrees from CIMIS HMS coordinate strings ("36º20'10N / 36.3360"). */
function parseHms(value?: string): number | undefined {
  if (!value) return undefined;
  const parts = value.split('/');
  const decimal = Number((parts.at(-1) ?? '').trim());
  return Number.isFinite(decimal) ? decimal : undefined;
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

function targetFor(point: GeoPoint): string {
  return `lat=${point.latitude},lng=${point.longitude}`;
}

function recordToReading(record: CimisRecord, point: GeoPoint | undefined): EvapotranspirationReading | null {
  const eto = num(record.DayAsceEto);
  if (eto === undefined) return null;
  return {
    date: record.Date,
    stationId: record.Station,
    location: point,
    eto,
    airTempF: num(record.DayAirTmpAvg),
    solarRadiation: num(record.DaySolRadAvg),
    precipitation: num(record.DayPrecip),
    source: record.Station ? 'CIMIS' : 'CIMIS (spatial)',
  };
}

// --- mock data fallback generators -------------------------------------------

function generateMockEtoHistory(point: GeoPoint, startDateStr: string, endDateStr: string): EvapotranspirationReading[] {
  const readings: EvapotranspirationReading[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfMonth = d.getDate();
    // Deterministic hash based on date and lat/lon
    const hash = (dayOfMonth * 17 + Math.floor(point.latitude * 31) + Math.floor(point.longitude * 53)) % 100;
    const eto = 0.22 + (hash / 1000); // 0.22 to 0.32 inches (Standard Central Valley June range)
    const airTempF = 78 + (hash / 5); // 78 to 98 degrees F
    const solarRadiation = 550 + hash; // 550 to 650 Solar Radiation
    const precipitation = hash > 90 ? 0.05 + (hash / 1000) : 0; // Occasional light rain
    
    readings.push({
      date: dateStr,
      stationId: '125', // Mock Fresno State station
      location: point,
      eto: parseFloat(eto.toFixed(3)),
      airTempF: parseFloat(airTempF.toFixed(1)),
      solarRadiation: Math.round(solarRadiation),
      precipitation: parseFloat(precipitation.toFixed(3)),
      source: 'CIMIS (mocked)',
    });
  }
  return readings;
}

function generateMockStations(): CimisStation[] {
  return [
    {
      stationId: '80',
      name: 'Fresno State',
      county: 'Fresno',
      location: { latitude: 36.7820, longitude: -119.7410 },
      elevationFt: 340,
      active: true,
    },
    {
      stationId: '125',
      name: 'Yolo Bypass',
      county: 'Yolo',
      location: { latitude: 38.5410, longitude: -121.7820 },
      elevationFt: 50,
      active: true,
    },
    {
      stationId: '139',
      name: 'Kern County',
      county: 'Kern',
      location: { latitude: 35.3733, longitude: -119.0187 },
      elevationFt: 400,
      active: true,
    }
  ];
}

// --- public API ---------------------------------------------------------------

export interface CimisDataOptions {
  startDate?: string;
  endDate?: string;
  appKey?: string;
  logger?: Logger;
}

/** Query daily ETo + weather for a coordinate window, normalized to readings (newest last). */
export async function getEtoHistory(point: GeoPoint, options: CimisDataOptions = {}): Promise<EvapotranspirationReading[]> {
  const appKey = options.appKey ?? getCimisAppKey();
  const startDate = options.startDate ?? isoDaysAgo(7);
  const endDate = options.endDate ?? isoDaysAgo(1);

  if (!appKey) {
    options.logger?.info('CIMIS_APP_KEY not configured; returning simulated ETo history mock data');
    return generateMockEtoHistory(point, startDate, endDate);
  }

  const params = new URLSearchParams({
    appKey,
    targets: targetFor(point),
    startDate,
    endDate,
    dataItems: DATA_ITEMS,
    unitOfMeasure: 'E',
  });
  const url = `${CIMIS_BASE}/data?${params.toString()}`;

  const json = await fetchJson<CimisDataResponse>(url, {
    label: 'CIMIS data',
    logger: options.logger,
    headers: { Accept: 'application/json' },
  });

  const readings: EvapotranspirationReading[] = [];
  for (const provider of json.Data?.Providers ?? []) {
    for (const record of provider.Records ?? []) {
      const reading = recordToReading(record, point);
      if (reading) readings.push(reading);
    }
  }
  readings.sort((a, b) => a.date.localeCompare(b.date));
  return readings;
}

/** Latest available daily ETo reading for a coordinate (CIMIS lags ~1-2 days). */
export async function getCurrentEto(point: GeoPoint, options: CimisDataOptions = {}): Promise<EvapotranspirationReading | null> {
  const readings = await getEtoHistory(point, options);
  return readings.at(-1) ?? null;
}

/** List CIMIS weather stations, normalized. */
export async function getStations(options: CimisDataOptions = {}): Promise<CimisStation[]> {
  const appKey = options.appKey ?? getCimisAppKey();
  if (!appKey) {
    options.logger?.info('CIMIS_APP_KEY not configured; returning simulated weather stations mock list');
    return generateMockStations();
  }

  const url = `${CIMIS_BASE}/station?appKey=${encodeURIComponent(appKey)}`;
  const json = await fetchJson<CimisStationResponse>(url, {
    label: 'CIMIS station',
    logger: options.logger,
    headers: { Accept: 'application/json' },
  });

  return (json.Stations ?? []).map((s) => ({
    stationId: s.StationNbr,
    name: s.Name,
    county: s.County ?? undefined,
    location: {
      latitude: parseHms(s.HmsLatitude) ?? 0,
      longitude: parseHms(s.HmsLongitude) ?? 0,
    },
    elevationFt: s.Elevation ? Number(s.Elevation) : undefined,
    active: s.IsActive === 'True',
  }));
}
