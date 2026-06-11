import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransferApi } from '../transfer.api';
import { ImportSession, ColumnMapping } from 'shared';

@Injectable()
export class HttpTransferService implements TransferApi {
  private readonly http = inject(HttpClient);

  createSession(sourceSystem: string): Observable<ImportSession> {
    return this.http.post<ImportSession>('/api/transfer/session', { sourceSystem });
  }

  suggestMappings(headers: string[]): Observable<ColumnMapping[]> {
    return this.http.post<ColumnMapping[]>('/api/transfer/suggest-mappings', { headers });
  }

  importCsv(
    importId: string,
    csvText: string,
    defaultFarmId?: string,
    mappings?: ColumnMapping[]
  ): Observable<ImportSession> {
    return this.http.post<ImportSession>('/api/transfer/import/csv', {
      importId,
      csvText,
      defaultFarmId,
      mappings,
    });
  }

  importGeoJson(
    importId: string,
    geojson: any,
    defaultFarmId?: string
  ): Observable<ImportSession> {
    return this.http.post<ImportSession>('/api/transfer/import/geojson', {
      importId,
      geojson,
      defaultFarmId,
    });
  }

  previewSession(importId: string): Observable<ImportSession> {
    return this.http.get<ImportSession>(`/api/transfer/preview/${importId}`);
  }

  commitSession(
    importId: string,
    defaultRanchId?: string
  ): Observable<{
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    operationsAdded: number;
  }> {
    return this.http.post<{
      success: boolean;
      created: number;
      updated: number;
      skipped: number;
      operationsAdded: number;
    }>('/api/transfer/commit', {
      importId,
      defaultRanchId,
    });
  }
}
