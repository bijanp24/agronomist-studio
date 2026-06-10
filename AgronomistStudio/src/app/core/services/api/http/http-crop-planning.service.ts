import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlantingPlan, HarvestRecord, YieldRecord } from 'shared';
import { CropPlanningApi } from '../crop-planning.api';

@Injectable({
  providedIn: 'root'
})
export class HttpCropPlanningService implements CropPlanningApi {
  private readonly http = inject(HttpClient);

  getPlantingPlans(fieldId?: string): Observable<PlantingPlan[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<PlantingPlan[]>('/api/planting-plans', { params });
  }

  getHarvestRecords(fieldId?: string): Observable<HarvestRecord[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<HarvestRecord[]>('/api/harvest-records', { params });
  }

  getYieldRecords(fieldId?: string): Observable<YieldRecord[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<YieldRecord[]>('/api/yield-records', { params });
  }
}
