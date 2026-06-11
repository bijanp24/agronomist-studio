import { Observable } from 'rxjs';
import { ImportSession, ColumnMapping } from 'shared';

export abstract class TransferApi {
  abstract createSession(sourceSystem: string): Observable<ImportSession>;
  
  abstract suggestMappings(headers: string[]): Observable<ColumnMapping[]>;
  
  abstract importCsv(
    importId: string,
    csvText: string,
    defaultFarmId?: string,
    mappings?: ColumnMapping[]
  ): Observable<ImportSession>;
  
  abstract importGeoJson(
    importId: string,
    geojson: any,
    defaultFarmId?: string
  ): Observable<ImportSession>;
  
  abstract previewSession(importId: string): Observable<ImportSession>;
  
  abstract commitSession(
    importId: string,
    defaultRanchId?: string
  ): Observable<{
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    operationsAdded: number;
  }>;
}
