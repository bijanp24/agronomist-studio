import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScoutingReport } from 'shared';
import { ScoutingApi } from '../scouting.api';

@Injectable({
  providedIn: 'root'
})
export class HttpScoutingService implements ScoutingApi {
  private readonly http = inject(HttpClient);

  getReports(fieldId?: string): Observable<ScoutingReport[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<ScoutingReport[]>('/api/scouting-reports', { params });
  }

  getReportById(id: string): Observable<ScoutingReport> {
    return this.http.get<ScoutingReport>(`/api/scouting-reports/${id}`);
  }

  createReport(report: Omit<ScoutingReport, 'id' | 'scoutedAt'>): Observable<ScoutingReport> {
    return this.http.post<ScoutingReport>('/api/scouting-reports', report);
  }
}
