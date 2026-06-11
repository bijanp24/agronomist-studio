import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, forkJoin } from 'rxjs';
import { PlantingPlan, HarvestRecord, YieldRecord } from 'shared';
import { CropPlanningApi } from '../services/api/crop-planning.api';

export interface PlanningState {
  plantingPlans: PlantingPlan[];
  harvestRecords: HarvestRecord[];
  yieldRecords: YieldRecord[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PlanningState = {
  plantingPlans: [],
  harvestRecords: [],
  yieldRecords: [],
  isLoading: false,
  error: null,
};

export const PlanningStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, cropPlanningApi = inject(CropPlanningApi)) => ({
    loadPlanningData: rxMethod<string | null | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          return forkJoin({
            plans: cropPlanningApi.getPlantingPlans(),
            harvests: cropPlanningApi.getHarvestRecords(),
            yields: cropPlanningApi.getYieldRecords()
          }).pipe(
            tap({
              next: (res) => patchState(store, {
                plantingPlans: res.plans,
                harvestRecords: res.harvests,
                yieldRecords: res.yields,
                isLoading: false
              }),
              error: (err: any) => patchState(store, { error: err.message || 'Unknown error', isLoading: false }),
            })
          );
        })
      )
    ),
    addPlantingPlan(plan: PlantingPlan): void {
      patchState(store, (state) => ({ plantingPlans: [plan, ...state.plantingPlans] }));
    },
    updatePlantingPlan(plan: PlantingPlan): void {
      patchState(store, (state) => ({
        plantingPlans: state.plantingPlans.map(p => p.id === plan.id ? plan : p)
      }));
    },
    addHarvestRecord(record: HarvestRecord): void {
      patchState(store, (state) => ({ harvestRecords: [record, ...state.harvestRecords] }));
    },
    addYieldRecord(record: YieldRecord): void {
      patchState(store, (state) => ({ yieldRecords: [record, ...state.yieldRecords] }));
    }
  }))
);
