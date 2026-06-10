import { Observable } from 'rxjs';
import { PestObservation, SprayRecommendation, PesticideUseReport } from 'shared';

export abstract class PestPcaApi {
  abstract getPestObservations(fieldId?: string): Observable<PestObservation[]>;
  abstract getSprayRecommendations(fieldId?: string): Observable<SprayRecommendation[]>;
  abstract createSprayRecommendation(rec: Omit<SprayRecommendation, 'id' | 'createdAt' | 'status'>): Observable<SprayRecommendation>;
  abstract updateSprayRecommendation(id: string, rec: Partial<SprayRecommendation>): Observable<SprayRecommendation>;
  abstract getPesticideUseReports(fieldId?: string): Observable<PesticideUseReport[]>;
  abstract createPesticideUseReport(pur: Omit<PesticideUseReport, 'id' | 'status'>): Observable<PesticideUseReport>;
}
export const PEST_PCA_API_TOKEN = PestPcaApi;
