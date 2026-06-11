import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, forkJoin } from 'rxjs';
import { PestObservation, SprayRecommendation, PesticideUseReport } from 'shared';
import { PestPcaApi } from '../services/api/pest-pca.api';

export interface PestState {
  pestObservations: PestObservation[];
  sprayRecommendations: SprayRecommendation[];
  pesticideUseReports: PesticideUseReport[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PestState = {
  pestObservations: [],
  sprayRecommendations: [],
  pesticideUseReports: [],
  isLoading: false,
  error: null,
};

export const PestStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, pestPcaApi = inject(PestPcaApi)) => ({
    loadPestDiagnostics: rxMethod<string | null | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          return forkJoin({
            obs: pestPcaApi.getPestObservations(),
            recs: pestPcaApi.getSprayRecommendations(),
            purs: pestPcaApi.getPesticideUseReports()
          }).pipe(
            tap({
              next: (res) => patchState(store, {
                pestObservations: res.obs,
                sprayRecommendations: res.recs,
                pesticideUseReports: res.purs,
                isLoading: false
              }),
              error: (err: any) => patchState(store, { error: err.message || 'Unknown error', isLoading: false }),
            })
          );
        })
      )
    ),
    addSprayRecommendation(rec: SprayRecommendation): void {
      patchState(store, (state) => ({ sprayRecommendations: [rec, ...state.sprayRecommendations] }));
    },
    updateSprayRecommendation(rec: SprayRecommendation): void {
      patchState(store, (state) => ({
        sprayRecommendations: state.sprayRecommendations.map(r => r.id === rec.id ? rec : r)
      }));
    },
    addPesticideUseReport(pur: PesticideUseReport): void {
      patchState(store, (state) => ({ pesticideUseReports: [pur, ...state.pesticideUseReports] }));
    },
    updatePesticideUseReport(pur: PesticideUseReport): void {
      patchState(store, (state) => ({
        pesticideUseReports: state.pesticideUseReports.map(p => p.id === pur.id ? pur : p)
      }));
    }
  }))
);
