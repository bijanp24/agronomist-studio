import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
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
export class InMemoryMlService implements MlApi {
  getHealth(): Observable<any> {
    return of({
      status: 'ok',
      demo_mode: true,
      active_models: { yield: 'demo-v1', risk: 'demo-v1', cluster: 'demo-v1' }
    }).pipe(delay(400));
  }

  predictYield(fieldId: string, cropName: string): Observable<YieldPrediction> {
    const predicted = 4250;
    const result: YieldPrediction = {
      field_id: fieldId,
      crop_name: cropName,
      crop_year: 2026,
      predicted_yield_kg_ha: predicted,
      yield_lower_kg_ha: predicted - 400,
      yield_upper_kg_ha: predicted + 400,
      baseline_yield_kg_ha: 4100,
      confidence: 'high',
      factor_water: 0.38,
      factor_nutrient: 0.29,
      factor_heat: 0.15,
      factor_uv: 0.08,
      factor_seed: 0.06,
      factor_planting: 0.04,
      limiting_factors: ['water', 'nutrient'],
      explanation: `The model predicts ${predicted.toLocaleString()} kg/ha for ${cropName} (In-Memory Simulation).`,
      disclaimer: 'Deterministic mock prediction.'
    };
    return of(result).pipe(delay(600));
  }

  getYieldHistory(fieldId: string, cropName: string): Observable<FieldYieldHistory> {
    const result: FieldYieldHistory = {
      field_id: fieldId,
      crop_name: cropName,
      history: [
        { crop_year: 2022, yield_kg_ha: 3950, irrigation_in: 36.2, nitrogen_applied_lb_ac: 155 },
        { crop_year: 2023, yield_kg_ha: 4120, irrigation_in: 38.5, nitrogen_applied_lb_ac: 160 },
        { crop_year: 2024, yield_kg_ha: 3800, irrigation_in: 34.0, nitrogen_applied_lb_ac: 148 },
        { crop_year: 2025, yield_kg_ha: 4300, irrigation_in: 39.1, nitrogen_applied_lb_ac: 172 }
      ]
    };
    return of(result).pipe(delay(500));
  }

  optimizeInputs(fieldId: string, irrigationIn?: number, nitrogenLbAc?: number): Observable<OptimizationResult> {
    const currentIrr = irrigationIn ?? 38.5;
    const currentNit = nitrogenLbAc ?? 160.0;
    const result: OptimizationResult = {
      field_id: fieldId,
      crop_year: 2026,
      current_irrigation_in: currentIrr,
      rec_irrigation_in: currentIrr + 4.5,
      irrigation_delta_in: 4.5,
      current_nitrogen_lb_ac: currentNit,
      rec_nitrogen_lb_ac: currentNit + 30.0,
      nitrogen_delta_lb_ac: 30.0,
      expected_yield_kg_ha: 4380,
      expected_yield_gain_pct: 6.3,
      baseline_yield_kg_ha: 4120,
      confidence: 'medium',
      explanation: 'The optimizer recommends increasing irrigation by 4.5 in and adding 30.0 lb/ac nitrogen. (In-Memory Simulation)',
      disclaimer: 'Deterministic mock optimization.'
    };
    return of(result).pipe(delay(600));
  }

  assessRisk(fieldId: string): Observable<RiskAssessment> {
    const result: RiskAssessment = {
      field_id: fieldId,
      crop_year: 2026,
      anomaly_score: 0.68,
      risk_label: 'high',
      residual_zscore: 2.1,
      top_risk_factors: ['season_irrigation_in', 'soil_ph'],
      cohort_id: 0,
      cohort_name: 'High-input intensive',
      explanation: 'Risk assessment: high (anomaly score 0.68). (In-Memory Simulation)',
      disclaimer: 'Deterministic mock risk assessment.'
    };
    return of(result).pipe(delay(500));
  }

  getRiskSummary(): Observable<RiskSummary> {
    const result: RiskSummary = {
      crop_year: 2026,
      fields: [
        {
          field_id: 'field-001',
          crop_year: 2026,
          anomaly_score: 0.68,
          risk_label: 'high',
          residual_zscore: 2.1,
          top_risk_factors: ['season_irrigation_in', 'soil_ph'],
          cohort_id: 0,
          cohort_name: 'High-input intensive',
          explanation: 'Risk high.',
          disclaimer: 'Mock.'
        }
      ]
    };
    return of(result).pipe(delay(600));
  }

  compareBenchmark(fieldId: string): Observable<BenchmarkResult> {
    const result: BenchmarkResult = {
      field_id: fieldId,
      crop_year: 2026,
      cluster_label: 0,
      cluster_name: 'High-input intensive',
      yield_kg_ha: 4380,
      percentile_rank: 72,
      cohort_size: 47,
      explanation: 'This field ranks at the 72nd percentile within its cohort. (In-Memory Simulation)',
      disclaimer: 'Deterministic mock benchmark.'
    };
    return of(result).pipe(delay(500));
  }

  getClusters(): Observable<{ clusters: ClusterInfo[] }> {
    return of({
      clusters: [
        { cluster_label: 0, cluster_name: 'High-input intensive' },
        { cluster_label: 1, cluster_name: 'Mixed cohort 1' },
        { cluster_label: 2, cluster_name: 'Low-input conservative' }
      ]
    }).pipe(delay(400));
  }

  trainModel(mtype: 'yield' | 'risk' | 'cluster'): Observable<any> {
    return of({
      status: 'ok',
      results: {
        [mtype]: { training_rows: 300, r2_score: 0.89, timestamp: new Date().toISOString() }
      }
    }).pipe(delay(1200));
  }
}
