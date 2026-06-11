import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { YieldPrediction, OptimizationResult, RiskAssessment, RiskSummary, BenchmarkResult, ClusterInfo, FieldYieldHistory } from 'shared';
import { MlApi } from '../services/api/ml.api';

export interface MlState {
  health: any | null;
  prediction: YieldPrediction | null;
  history: FieldYieldHistory | null;
  optimization: OptimizationResult | null;
  riskAssessment: RiskAssessment | null;
  riskSummary: RiskSummary | null;
  benchmark: BenchmarkResult | null;
  clusters: ClusterInfo[];
  trainingStatus: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MlState = {
  health: null,
  prediction: null,
  history: null,
  optimization: null,
  riskAssessment: null,
  riskSummary: null,
  benchmark: null,
  clusters: [],
  trainingStatus: null,
  isLoading: false,
  error: null,
};

export const MlStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ prediction, optimization, riskAssessment, benchmark }) => ({
    hasPrediction: computed(() => prediction() !== null),
    hasOptimization: computed(() => optimization() !== null),
    hasRisk: computed(() => riskAssessment() !== null),
    hasBenchmark: computed(() => benchmark() !== null),
  })),
  withMethods((store, mlApi = inject(MlApi)) => ({
    loadHealth: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          mlApi.getHealth().pipe(
            tap({
              next: (health) => patchState(store, { health, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to load ML health', isLoading: false }),
            })
          )
        )
      )
    ),
    loadClusters: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          mlApi.getClusters().pipe(
            tap({
              next: ({ clusters }) => patchState(store, { clusters, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to load clusters', isLoading: false }),
            })
          )
        )
      )
    ),
    predictYield: rxMethod<{ fieldId: string; cropName: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ fieldId, cropName }) =>
          mlApi.predictYield(fieldId, cropName).pipe(
            tap({
              next: (prediction) => patchState(store, { prediction, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to predict yield', isLoading: false }),
            })
          )
        )
      )
    ),
    loadYieldHistory: rxMethod<{ fieldId: string; cropName: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ fieldId, cropName }) =>
          mlApi.getYieldHistory(fieldId, cropName).pipe(
            tap({
              next: (history) => patchState(store, { history, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to load yield history', isLoading: false }),
            })
          )
        )
      )
    ),
    optimizeInputs: rxMethod<{ fieldId: string; irrigationIn?: number; nitrogenLbAc?: number }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ fieldId, irrigationIn, nitrogenLbAc }) =>
          mlApi.optimizeInputs(fieldId, irrigationIn, nitrogenLbAc).pipe(
            tap({
              next: (optimization) => patchState(store, { optimization, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to optimize inputs', isLoading: false }),
            })
          )
        )
      )
    ),
    assessRisk: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((fieldId) =>
          mlApi.assessRisk(fieldId).pipe(
            tap({
              next: (riskAssessment) => patchState(store, { riskAssessment, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to assess risk', isLoading: false }),
            })
          )
        )
      )
    ),
    loadRiskSummary: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          mlApi.getRiskSummary().pipe(
            tap({
              next: (riskSummary) => patchState(store, { riskSummary, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to load risk summary', isLoading: false }),
            })
          )
        )
      )
    ),
    compareBenchmark: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((fieldId) =>
          mlApi.compareBenchmark(fieldId).pipe(
            tap({
              next: (benchmark) => patchState(store, { benchmark, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to compare benchmark', isLoading: false }),
            })
          )
        )
      )
    ),
    trainModel: rxMethod<'yield' | 'risk' | 'cluster'>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((mtype) =>
          mlApi.trainModel(mtype).pipe(
            tap({
              next: (trainingStatus) => patchState(store, { trainingStatus, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to train model', isLoading: false }),
            })
          )
        )
      )
    ),
    resetMlResults: () => {
      patchState(store, {
        prediction: null,
        history: null,
        optimization: null,
        riskAssessment: null,
        benchmark: null,
        error: null,
      });
    }
  }))
);
