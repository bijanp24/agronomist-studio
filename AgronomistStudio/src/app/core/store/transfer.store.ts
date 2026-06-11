import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, timer, of } from 'rxjs';
import { concatMap, takeWhile, expand, delay } from 'rxjs/operators';
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
  withMethods((store, transferApi = inject(TransferApi)) => {
    // Helper to poll the session status until it reaches a stop status
    const pollSession = (importId: string, stopStatuses: string[]) => {
      return transferApi.previewSession(importId).pipe(
        expand((session) => {
          if (stopStatuses.includes(session.status)) {
            return of(session).pipe(delay(0));
          }
          return timer(1500).pipe(
            concatMap(() => transferApi.previewSession(importId))
          );
        }),
        takeWhile((session) => !stopStatuses.includes(session.status), true)
      );
    };

    return {
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
              switchMap(() => pollSession(importId, ['validated', 'failed', 'committed'])),
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
              switchMap(() => pollSession(importId, ['validated', 'failed', 'committed'])),
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
              switchMap(() => pollSession(importId, ['committed', 'failed'])),
              tap({
                next: (session) => {
                  if (session.status === 'committed') {
                    patchState(store, {
                      session,
                      commitReport: {
                        success: true,
                        created: session.created,
                        updated: session.updated,
                        skipped: session.skipped,
                        operationsAdded: session.operations?.length ?? 0,
                      },
                      isLoading: false,
                    });
                  } else {
                    patchState(store, {
                      session,
                      error: session.errors?.[0]?.message || 'Commit failed',
                      isLoading: false,
                    });
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
    };
  })
);
