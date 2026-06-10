import { Observable } from 'rxjs';
import { ScoutingReport } from 'shared';

export abstract class ScoutingApi {
  abstract getReports(fieldId?: string): Observable<ScoutingReport[]>;
  abstract getReportById(id: string): Observable<ScoutingReport>;
  abstract createReport(report: Omit<ScoutingReport, 'id' | 'scoutedAt'>): Observable<ScoutingReport>;
}
export const SCOUTING_API_TOKEN = ScoutingApi;
