import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { LatLon, ElevationGrid, CarryingCapacityInputs, LearningBlockResult } from 'shared';
import { SpatialApi } from '../services/api/spatial.api';

export interface SpatialState {
  boundaryResult: LearningBlockResult | null;
  terrainResult: LearningBlockResult | null;
  carryingResult: LearningBlockResult | null;
  demoField: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SpatialState = {
  boundaryResult: null,
  terrainResult: null,
  carryingResult: null,
  demoField: null,
  isLoading: false,
  error: null,
};

export const SpatialStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ boundaryResult, terrainResult, carryingResult }) => ({
    hasBoundary: computed(() => boundaryResult() !== null),
    hasTerrain: computed(() => terrainResult() !== null),
    hasCarrying: computed(() => carryingResult() !== null),
  })),
  withMethods((store, spatialApi = inject(SpatialApi)) => ({
    loadDemoField: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          spatialApi.getDemoField().pipe(
            tap({
              next: (demoField) => patchState(store, { demoField, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to load demo field', isLoading: false }),
            })
          )
        )
      )
    ),
    calculateBoundaryArea: rxMethod<{ ring: LatLon[]; unit?: 'acre' | 'hectare' }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ ring, unit }) =>
          spatialApi.calculateBoundaryArea(ring, unit).pipe(
            tap({
              next: (boundaryResult) => patchState(store, { boundaryResult, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to calculate boundary area', isLoading: false }),
            })
          )
        )
      )
    ),
    calculateTerrainFlow: rxMethod<ElevationGrid>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((grid) =>
          spatialApi.calculateTerrainFlow(grid).pipe(
            tap({
              next: (terrainResult) => patchState(store, { terrainResult, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to calculate terrain flow', isLoading: false }),
            })
          )
        )
      )
    ),
    calculateCarryingCapacity: rxMethod<CarryingCapacityInputs>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((inputs) =>
          spatialApi.calculateCarryingCapacity(inputs).pipe(
            tap({
              next: (carryingResult) => patchState(store, { carryingResult, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to calculate carrying capacity', isLoading: false }),
            })
          )
        )
      )
    ),
    resetResults: () => {
      patchState(store, {
        boundaryResult: null,
        terrainResult: null,
        carryingResult: null,
        error: null,
      });
    }
  }))
);
