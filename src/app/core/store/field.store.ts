import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Field } from '../models/field.model';
import { MockDataService } from '../services/mock-data.service';

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
  withMethods((store, mockDataService = inject(MockDataService)) => ({
    loadFields: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          return mockDataService.getFields().pipe(
            tap({
              next: (fields) => patchState(store, { fields, isLoading: false }),
              error: (err) => patchState(store, { error: err.message, isLoading: false }),
            })
          );
        })
      )
    ),
  }))
);
