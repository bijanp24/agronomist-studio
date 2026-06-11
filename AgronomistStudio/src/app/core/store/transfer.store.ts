import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ImportSession, ColumnMapping } from 'shared';
import { TransferApi } from '../services/api/transfer.api';

export interface TransferState {
  session: ImportSession | null;
  suggestedMappings: ColumnMapping[];
  commitReport: {
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    operationsAdded: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TransferState = {
  session: null,
  suggestedMappings: [],
  commitReport: null,
  isLoading: false,
  error: null,
};

export const TransferStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ session, suggestedMappings, commitReport }) => ({
    hasSession: computed(() => session() !== null),
    hasErrors: computed(() => (session()?.errors?.length ?? 0) > 0),
    isCommitted: computed(() => session()?.status === 'committed'),
  })),
  withMethods((store, transferApi = inject(TransferApi)) => ({
    resetStore() {
      patchState(store, initialState);
    },
    
    createSession: rxMethod<{ sourceSystem: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null, commitReport: null })),
        switchMap(({ sourceSystem }) =>
          transferApi.createSession(sourceSystem).pipe(
            tap({
              next: (session) => {
                patchState(store, { session, isLoading: false });
              },
              error: (err) => {
                patchState(store, { error: err.message || 'Failed to create session', isLoading: false });
              },
            })
          )
        )
      )
    ),

    suggestMappings: rxMethod<{ headers: string[] }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ headers }) =>
          transferApi.suggestMappings(headers).pipe(
            tap({
              next: (suggestedMappings) => {
                patchState(store, { suggestedMappings, isLoading: false });
              },
              error: (err) => {
                patchState(store, { error: err.message || 'Failed to suggest mappings', isLoading: false });
              },
            })
          )
        )
      )
    ),

    importCsv: rxMethod<{
      importId: string;
      csvText: string;
      defaultFarmId?: string;
      mappings?: ColumnMapping[];
    }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ importId, csvText, defaultFarmId, mappings }) =>
          transferApi.importCsv(importId, csvText, defaultFarmId, mappings).pipe(
            tap({
              next: (session) => {
                patchState(store, { session, isLoading: false });
              },
              error: (err) => {
                patchState(store, { error: err.message || 'Failed to import CSV', isLoading: false });
              },
            })
          )
        )
      )
    ),

    importGeoJson: rxMethod<{
      importId: string;
      geojson: any;
      defaultFarmId?: string;
    }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ importId, geojson, defaultFarmId }) =>
          transferApi.importGeoJson(importId, geojson, defaultFarmId).pipe(
            tap({
              next: (session) => {
                patchState(store, { session, isLoading: false });
              },
              error: (err) => {
                patchState(store, { error: err.message || 'Failed to import GeoJSON', isLoading: false });
              },
            })
          )
        )
      )
    ),

    commitSession: rxMethod<{
      importId: string;
      defaultRanchId?: string;
    }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ importId, defaultRanchId }) =>
          transferApi.commitSession(importId, defaultRanchId).pipe(
            tap({
              next: (commitReport) => {
                const currentSession = store.session();
                if (currentSession) {
                  patchState(store, {
                    session: { ...currentSession, status: 'committed' },
                    commitReport,
                    isLoading: false,
                  });
                } else {
                  patchState(store, { commitReport, isLoading: false });
                }
              },
              error: (err) => {
                patchState(store, { error: err.message || 'Failed to commit session', isLoading: false });
              },
            })
          )
        )
      )
    ),
  }))
);
