import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
export class HttpAgronomyService implements AgronomyApi {
  private readonly http = inject(HttpClient);

  getLocationSummary(
    lat: number,
    lon: number,
    cropId?: string,
    cropName?: string,
    efficiency?: number
  ): Observable<AgronomyLocationSummary> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    if (cropId) params = params.set('cropId', cropId);
    if (cropName) params = params.set('crop', cropName);
    if (efficiency !== undefined) params = params.set('efficiency', efficiency.toString());

    return this.http.get<AgronomyLocationSummary>('/api/agronomy/location-summary', { params });
  }

  getIrrigationRecommendation(
    lat: number,
    lon: number,
    cropId?: string,
    cropName?: string,
    efficiency?: number,
    etoOverride?: number
  ): Observable<IrrigationRecommendation> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    if (cropId) params = params.set('cropId', cropId);
    if (cropName) params = params.set('crop', cropName);
    if (efficiency !== undefined) params = params.set('efficiency', efficiency.toString());
    if (etoOverride !== undefined) params = params.set('eto', etoOverride.toString());

    return this.http.get<IrrigationRecommendation>('/api/agronomy/irrigation-recommendation', { params });
  }

  getSoilWaterBalance(lat: number, lon: number): Observable<SoilWaterBalance> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    return this.http.get<SoilWaterBalance>('/api/agronomy/soil-water-balance', { params });
  }

  getRiskSummary(lat: number, lon: number): Observable<RiskSummary> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    return this.http.get<RiskSummary>('/api/agronomy/risk-summary', { params });
  }
}
