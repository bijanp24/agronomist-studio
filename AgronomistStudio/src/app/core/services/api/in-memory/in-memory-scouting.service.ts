import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ScoutingReport, mockScoutingReports } from 'shared';
import { ScoutingApi } from '../scouting.api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryScoutingService implements ScoutingApi {
  private reports: ScoutingReport[] = [...mockScoutingReports];

  getReports(fieldId?: string): Observable<ScoutingReport[]> {
    const list = fieldId ? this.reports.filter(r => r.fieldId === fieldId) : this.reports;
    return of(list).pipe(delay(800));
  }

  getReportById(id: string): Observable<ScoutingReport> {
    const report = this.reports.find(r => r.id === id);
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }
    return of(report).pipe(delay(500));
  }

  createReport(report: Omit<ScoutingReport, 'id' | 'scoutedAt'>): Observable<ScoutingReport> {
    const newReport: ScoutingReport = {
      id: Math.random().toString(36).substring(2, 9),
      scoutedAt: new Date().toISOString(),
      ...report
    };
    this.reports.push(newReport);
    return of(newReport).pipe(delay(500));
  }
}
