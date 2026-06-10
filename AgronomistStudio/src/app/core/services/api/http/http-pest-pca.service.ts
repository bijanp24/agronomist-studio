import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PestObservation, SprayRecommendation, PesticideUseReport } from 'shared';
import { PestPcaApi } from '../pest-pca.api';

@Injectable({
  providedIn: 'root'
})
export class HttpPestPcaService implements PestPcaApi {
  private readonly http = inject(HttpClient);

  getPestObservations(fieldId?: string): Observable<PestObservation[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<PestObservation[]>('/api/pest-observations', { params });
  }

  getSprayRecommendations(fieldId?: string): Observable<SprayRecommendation[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<SprayRecommendation[]>('/api/spray-recommendations', { params });
  }

  createSprayRecommendation(rec: Omit<SprayRecommendation, 'id' | 'createdAt' | 'status'>): Observable<SprayRecommendation> {
    return this.http.post<SprayRecommendation>('/api/spray-recommendations', rec);
  }

  updateSprayRecommendation(id: string, rec: Partial<SprayRecommendation>): Observable<SprayRecommendation> {
    return this.http.patch<SprayRecommendation>(`/api/spray-recommendations/${id}`, rec);
  }

  getPesticideUseReports(fieldId?: string): Observable<PesticideUseReport[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<PesticideUseReport[]>('/api/pesticide-use-reports', { params });
  }

  createPesticideUseReport(pur: Omit<PesticideUseReport, 'id' | 'status'>): Observable<PesticideUseReport> {
    return this.http.post<PesticideUseReport>('/api/pesticide-use-reports', pur);
  }
}
