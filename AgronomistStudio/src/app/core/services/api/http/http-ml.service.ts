import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  YieldPrediction,
  OptimizationResult,
  RiskAssessment,
  RiskSummary,
  BenchmarkResult,
  ClusterInfo,
  FieldYieldHistory
} from 'shared';
import { MlApi } from '../ml.api';

@Injectable({
  providedIn: 'root'
})
export class HttpMlService implements MlApi {
  private readonly http = inject(HttpClient);

  getHealth(): Observable<any> {
    return this.http.get<any>('/api/ml/health');
  }

  predictYield(fieldId: string, cropName: string): Observable<YieldPrediction> {
    return this.http.post<YieldPrediction>('/api/ml/yield/predict', { field_id: fieldId, crop_name: cropName });
  }

  getYieldHistory(fieldId: string, cropName: string): Observable<FieldYieldHistory> {
    return this.http.get<FieldYieldHistory>(`/api/ml/yield/history/${fieldId}`, {
      params: { crop: cropName }
    });
  }

  optimizeInputs(fieldId: string, irrigationIn?: number, nitrogenLbAc?: number): Observable<OptimizationResult> {
    const body: any = { field_id: fieldId };
    if (irrigationIn !== undefined) body.irrigation_in = irrigationIn;
    if (nitrogenLbAc !== undefined) body.nitrogen_lb_ac = nitrogenLbAc;
    return this.http.post<OptimizationResult>('/api/ml/optimize/inputs', body);
  }

  assessRisk(fieldId: string): Observable<RiskAssessment> {
    return this.http.post<RiskAssessment>('/api/ml/risk/assess', { field_id: fieldId });
  }

  getRiskSummary(): Observable<RiskSummary> {
    return this.http.get<RiskSummary>('/api/ml/risk/summary');
  }

  compareBenchmark(fieldId: string): Observable<BenchmarkResult> {
    return this.http.post<BenchmarkResult>('/api/ml/benchmark/compare', { field_id: fieldId });
  }

  getClusters(): Observable<{ clusters: ClusterInfo[] }> {
    return this.http.get<{ clusters: ClusterInfo[] }>('/api/ml/benchmark/clusters');
  }

  trainModel(mtype: 'yield' | 'risk' | 'cluster'): Observable<any> {
    return this.http.post<any>(`/api/ml/train/${mtype}`, {});
  }
}
