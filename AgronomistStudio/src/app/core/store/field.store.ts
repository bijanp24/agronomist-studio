import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Field } from 'shared';
import { RanchesFieldsApi } from '../services/api/ranches-fields.api';

export interface FieldState {
  fields: Field[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FieldState = {
  fields: [],
  isLoading: false,
  error: null,
};

export const FieldStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ fields }) => ({
    totalArea: computed(() => fields().reduce((acc, field) => acc + field.areaAcres, 0)),
    criticalFields: computed(() => fields().filter(f => f.status === 'critical')),
    needsAttentionFields: computed(() => fields().filter(f => f.status === 'needs-attention')),
    healthyFields: computed(() => fields().filter(f => f.status === 'healthy')),
  })),
  withMethods((store, ranchesFieldsApi = inject(RanchesFieldsApi)) => ({
    loadFields: rxMethod<string | null | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((ranchId) => {
          const id = typeof ranchId === 'string' ? ranchId : undefined;
          return ranchesFieldsApi.getFields(id).pipe(
            tap({
              next: (fields) => patchState(store, { fields, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Unknown error', isLoading: false }),
            })
          );
        })
      )
    ),
  }))
);
