import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Ranch } from 'shared';
import { RanchesFieldsApi } from '../services/api/ranches-fields.api';

export interface RanchState {
  ranches: Ranch[];
  selectedRanchId: string | null; // null represents "All Ranches"
  globalSearchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: RanchState = {
  ranches: [],
  selectedRanchId: null,
  globalSearchQuery: '',
  isLoading: false,
  error: null,
};

export const RanchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ ranches, selectedRanchId }) => ({
    selectedRanch: computed(() => {
      const id = selectedRanchId();
      if (!id) return null;
      return ranches().find(r => r.id === id) || null;
    }),
    selectedRanchName: computed(() => {
      const id = selectedRanchId();
      if (!id) return 'All Ranches';
      const ranch = ranches().find(r => r.id === id);
      return ranch ? ranch.name : 'All Ranches';
    })
  })),
  withMethods((store, ranchesFieldsApi = inject(RanchesFieldsApi)) => ({
    loadRanches: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          return ranchesFieldsApi.getRanches().pipe(
            tap({
              next: (ranches) => patchState(store, { ranches, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Failed to load ranches', isLoading: false })
            })
          );
        })
      )
    ),
    selectRanch(id: string | null): void {
      patchState(store, { selectedRanchId: id });
    },
    setSearchQuery(query: string): void {
      patchState(store, { globalSearchQuery: query });
    }
  }))
);
