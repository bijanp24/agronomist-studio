import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TransferApi } from '../transfer.api';
import { ImportSession, ColumnMapping } from 'shared';

@Injectable()
export class InMemoryTransferService implements TransferApi {
  private sessions = new Map<string, ImportSession>();

  createSession(sourceSystem: string): Observable<ImportSession> {
    const importId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session: ImportSession = {
      importId,
      sourceSystem,
      status: 'pending',
      created: 0,
      updated: 0,
      skipped: 0,
      conflicted: 0,
      errors: [],
      organizations: [],
      farms: [],
      fields: [],
      cropSeasons: [],
      operations: [],
    };
    this.sessions.set(importId, session);
    return of(session).pipe(delay(500));
  }

  suggestMappings(headers: string[]): Observable<ColumnMapping[]> {
    const aliases: Record<string, string> = {
      field_name: 'name',
      fieldname: 'name',
      field: 'name',
      block: 'name',
      acres: 'areaValue',
      area: 'areaValue',
      crop: 'cropName',
      commodity: 'cropName',
      variety: 'variety',
      year: 'cropYear',
      date: 'date',
      operation: 'operationType',
    };
    const mappings = headers.map((h) => ({
      sourceColumn: h,
      canonicalField: aliases[h.toLowerCase().trim()] || h,
    }));
    return of(mappings).pipe(delay(300));
  }

  importCsv(
    importId: string,
    csvText: string,
    defaultFarmId?: string,
    mappings?: ColumnMapping[]
  ): Observable<ImportSession> {
    const session = this.sessions.get(importId);
    if (!session) {
      throw new Error(`Import session ${importId} not found`);
    }

    // Mock successful CSV parsing
    const rows = [
      { name: 'North Pivot 1', areaValue: 120.5, cropName: 'Almonds', cropYear: 2026 },
      { name: 'South Slope 2', areaValue: 85.2, cropName: 'Processing Tomatoes', cropYear: 2026 },
    ];

    session.fields = rows.map((r, i) => ({
      id: `field-mock-${i}-${Date.now()}`,
      farmId: defaultFarmId || 'ranch-1',
      name: r.name,
      area: { value: r.areaValue, unit: 'acre' },
      sourceSystem: session.sourceSystem,
    }));

    session.cropSeasons = rows.map((r, i) => ({
      id: `season-mock-${i}-${Date.now()}`,
      fieldId: session.fields[i].id!,
      cropYear: r.cropYear,
      cropName: r.cropName,
    }));

    session.status = 'validated';
    session.errors = [];
    session.updated = Date.now();

    return of(session).pipe(delay(700));
  }

  importGeoJson(
    importId: string,
    geojson: any,
    defaultFarmId?: string
  ): Observable<ImportSession> {
    const session = this.sessions.get(importId);
    if (!session) {
      throw new Error(`Import session ${importId} not found`);
    }

    session.fields = [
      {
        id: `field-geo-mock-${Date.now()}`,
        farmId: defaultFarmId || 'ranch-1',
        name: 'Geo Imported Field',
        area: { value: 45.8, unit: 'acre' },
        boundary: { type: 'Polygon', coordinates: [] },
        sourceSystem: session.sourceSystem,
      }
    ];

    session.cropSeasons = [
      {
        id: `season-geo-mock-${Date.now()}`,
        fieldId: session.fields[0].id!,
        cropYear: 2026,
        cropName: 'Almonds',
      }
    ];

    session.status = 'validated';
    session.errors = [];
    session.updated = Date.now();

    return of(session).pipe(delay(700));
  }

  previewSession(importId: string): Observable<ImportSession> {
    const session = this.sessions.get(importId);
    if (!session) {
      throw new Error(`Import session ${importId} not found`);
    }
    return of(session).pipe(delay(300));
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
    const session = this.sessions.get(importId);
    if (!session) {
      throw new Error(`Import session ${importId} not found`);
    }

    session.status = 'committed';
    return of({
      success: true,
      created: session.fields.length,
      updated: 0,
      skipped: 0,
      operationsAdded: session.operations.length,
    }).pipe(delay(800));
  }
}
