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

export abstract class MlApi {
  abstract getHealth(): Observable<any>;
  abstract predictYield(fieldId: string, cropName: string): Observable<YieldPrediction>;
  abstract getYieldHistory(fieldId: string, cropName: string): Observable<FieldYieldHistory>;
  abstract optimizeInputs(fieldId: string, irrigationIn?: number, nitrogenLbAc?: number): Observable<OptimizationResult>;
  abstract assessRisk(fieldId: string): Observable<RiskAssessment>;
  abstract getRiskSummary(): Observable<RiskSummary>;
  abstract compareBenchmark(fieldId: string): Observable<BenchmarkResult>;
  abstract getClusters(): Observable<{ clusters: ClusterInfo[] }>;
  abstract trainModel(mtype: 'yield' | 'risk' | 'cluster'): Observable<any>;
}
