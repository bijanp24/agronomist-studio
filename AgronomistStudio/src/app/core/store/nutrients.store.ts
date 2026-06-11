import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, forkJoin } from 'rxjs';
import { SoilSample, TissueSample, NitrogenPlan } from 'shared';
import { NutrientsApi } from '../services/api/nutrients.api';

export interface NutrientsState {
  soilSamples: SoilSample[];
  tissueSamples: TissueSample[];
  nitrogenPlans: NitrogenPlan[];
  isLoading: boolean;
  error: string | null;
}

const initialState: NutrientsState = {
  soilSamples: [],
  tissueSamples: [],
  nitrogenPlans: [],
  isLoading: false,
  error: null,
};

export const NutrientsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, nutrientsApi = inject(NutrientsApi)) => ({
    loadNutrientsTelemetry: rxMethod<string | null | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          return forkJoin({
            soil: nutrientsApi.getSoilSamples(),
            tissue: nutrientsApi.getTissueSamples(),
            nitrogen: nutrientsApi.getNitrogenPlans()
          }).pipe(
            tap({
              next: (res) => patchState(store, {
                soilSamples: res.soil,
                tissueSamples: res.tissue,
                nitrogenPlans: res.nitrogen,
                isLoading: false
              }),
              error: (err: any) => patchState(store, { error: err.message || 'Unknown error', isLoading: false }),
            })
          );
        })
      )
    ),
    addSoilSample(sample: SoilSample): void {
      patchState(store, (state) => ({ soilSamples: [sample, ...state.soilSamples] }));
    },
    addTissueSample(sample: TissueSample): void {
      patchState(store, (state) => ({ tissueSamples: [sample, ...state.tissueSamples] }));
    },
    updateNitrogenPlan(plan: NitrogenPlan): void {
      patchState(store, (state) => ({
        nitrogenPlans: state.nitrogenPlans.map(p => p.id === plan.id ? plan : p)
      }));
    }
  }))
);
