import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SoilSample, TissueSample, NitrogenPlan } from 'shared';
import { NutrientsApi } from '../nutrients.api';

@Injectable({
  providedIn: 'root'
})
export class HttpNutrientsService implements NutrientsApi {
  private readonly http = inject(HttpClient);

  getSoilSamples(fieldId?: string): Observable<SoilSample[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<SoilSample[]>('/api/soil-samples', { params });
  }

  getTissueSamples(fieldId?: string): Observable<TissueSample[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<TissueSample[]>('/api/tissue-samples', { params });
  }

  getNitrogenPlans(fieldId?: string): Observable<NitrogenPlan[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<NitrogenPlan[]>('/api/nitrogen-plans', { params });
  }
}
