import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  AgronomyApi,
  AgronomyLocationSummary,
  IrrigationRecommendation,
  SoilWaterBalance,
  RiskSummary
} from '../agronomy.api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryAgronomyService implements AgronomyApi {
  getLocationSummary(
    lat: number,
    lon: number,
    cropId?: string,
    cropName?: string,
    efficiency?: number
  ): Observable<AgronomyLocationSummary> {
    const summary: AgronomyLocationSummary = {
      location: { latitude: lat, longitude: lon },
      county: lat > 38 ? 'Yolo' : (lat > 36 ? 'Fresno' : 'Kern'),
      resolvedAt: new Date().toISOString(),
      evapotranspiration: {
        date: new Date().toISOString().slice(0, 10),
        stationName: 'Fresno State',
        eto: 0.28,
        airTempF: 88,
        solarRadiation: 540,
        precipitation: 0,
        source: 'CIMIS (mocked)'
      },
      forecast: [
        { date: new Date().toISOString().slice(0, 10), eto: 0.29, maxTempF: 90, minTempF: 62, source: 'FRET (mocked)' },
        { date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), eto: 0.31, maxTempF: 92, minTempF: 64, source: 'FRET (mocked)' },
        { date: new Date(Date.now() + 172800000).toISOString().slice(0, 10), eto: 0.30, maxTempF: 95, minTempF: 65, source: 'FRET (mocked)' }
      ],
      soil: {
        location: { latitude: lat, longitude: lon },
        mapUnitName: 'Hanford sandy loam',
        texture: 'sandy loam',
        drainageClass: 'well drained',
        hydrologicGroup: 'B',
        availableWaterCapacity: 0.12,
        rootZoneDepthIn: 36,
        source: 'NRCS SSURGO (mocked)'
      },
      irrigation: {
        cropName: cropName ?? 'Almonds',
        eto: 0.28,
        kc: 0.95,
        cropEt: 0.266,
        netIrrigationIn: 1.86,
        grossIrrigationIn: 2.19,
        intervalDays: 7,
        readilyAvailableWaterIn: 2.05,
        forecastRainIn: 0,
        systemEfficiency: efficiency ?? 0.85,
        heatRisk: false,
        confidence: 'high',
        notes: [
          'Crop ET is currently moderate.',
          'Consider scheduling an irrigation set in 2 days to maintain root zone saturation.',
          'No significant rainfall forecasted over the next 7 days.'
        ]
      }
    };

    return of(summary).pipe(delay(600));
  }

  getIrrigationRecommendation(
    lat: number,
    lon: number,
    cropId?: string,
    cropName?: string,
    efficiency?: number,
    etoOverride?: number
  ): Observable<IrrigationRecommendation> {
    const eto = etoOverride ?? 0.28;
    const eff = efficiency ?? 0.85;
    const kc = 0.95;
    const cropEt = eto * kc;

    const recommendation: IrrigationRecommendation = {
      cropName: cropName ?? 'Almonds',
      eto,
      kc,
      cropEt,
      netIrrigationIn: eto * kc * 7,
      grossIrrigationIn: (eto * kc * 7) / eff,
      intervalDays: 7,
      readilyAvailableWaterIn: 2.05,
      forecastRainIn: 0,
      systemEfficiency: eff,
      heatRisk: eto > 0.3,
      confidence: 'medium',
      notes: [
        `Computed using ETo value of ${eto} in/day.`,
        'Water demand is entering peak summer rates. Monitor soil probes closely.'
      ]
    };

    return of(recommendation).pipe(delay(400));
  }

  getSoilWaterBalance(lat: number, lon: number): Observable<SoilWaterBalance> {
    const balance: SoilWaterBalance = {
      location: { latitude: lat, longitude: lon },
      availableWaterCapacity: 0.12,
      rootZoneDepthIn: 36,
      totalAvailableWaterIn: 4.32,
      readilyAvailableWaterIn: 2.16,
      recentEtIn: 1.86,
      forecastEtIn: 2.10,
      forecastRainIn: 0,
      projectedDeficitIn: -1.80
    };

    return of(balance).pipe(delay(400));
  }

  getRiskSummary(lat: number, lon: number): Observable<RiskSummary> {
    const risk: RiskSummary = {
      location: { latitude: lat, longitude: lon },
      heatRisk: false,
      droughtStress: false,
      waterQualityConcern: false,
      notes: ['No extreme weather risks forecasted.', 'Soil salinity indices are within safe tolerance thresholds.']
    };

    return of(risk).pipe(delay(300));
  }
}
