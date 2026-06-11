import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ScoutingReport } from 'shared';
import { ScoutingApi } from '../services/api/scouting.api';

export interface ScoutingState {
  reports: ScoutingReport[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ScoutingState = {
  reports: [],
  isLoading: false,
  error: null,
};

export const ScoutingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, scoutingApi = inject(ScoutingApi)) => ({
    loadReports: rxMethod<string | null | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((fieldId) => {
          const id = typeof fieldId === 'string' ? fieldId : undefined;
          return scoutingApi.getReports(id).pipe(
            tap({
              next: (reports) => patchState(store, { reports, isLoading: false }),
              error: (err: any) => patchState(store, { error: err.message || 'Unknown error', isLoading: false }),
            })
          );
        })
      )
    ),
    addReport(report: ScoutingReport): void {
      patchState(store, (state) => ({ reports: [report, ...state.reports] }));
    }
  }))
);
