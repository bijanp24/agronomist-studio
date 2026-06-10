import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PestObservation, SprayRecommendation, PesticideUseReport, mockPestObservations, mockSprayRecommendations, mockPesticideUseReports } from 'shared';
import { PestPcaApi } from '../pest-pca.api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryPestPcaService implements PestPcaApi {
  private pestObservations = [...mockPestObservations];
  private sprayRecommendations: SprayRecommendation[] = [...mockSprayRecommendations];
  private pesticideUseReports: PesticideUseReport[] = [...mockPesticideUseReports];

  getPestObservations(fieldId?: string): Observable<PestObservation[]> {
    const list = fieldId ? this.pestObservations.filter(po => po.fieldId === fieldId) : this.pestObservations;
    return of(list).pipe(delay(800));
  }

  getSprayRecommendations(fieldId?: string): Observable<SprayRecommendation[]> {
    const list = fieldId ? this.sprayRecommendations.filter(r => r.fieldId === fieldId) : this.sprayRecommendations;
    return of(list).pipe(delay(800));
  }

  createSprayRecommendation(rec: Omit<SprayRecommendation, 'id' | 'createdAt' | 'status'>): Observable<SprayRecommendation> {
    const newRec: SprayRecommendation = {
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      status: 'draft',
      ...rec
    };
    this.sprayRecommendations.push(newRec);
    return of(newRec).pipe(delay(500));
  }

  updateSprayRecommendation(id: string, rec: Partial<SprayRecommendation>): Observable<SprayRecommendation> {
    const match = this.sprayRecommendations.find(r => r.id === id);
    if (!match) {
      throw new Error(`Spray recommendation ${id} not found`);
    }
    Object.assign(match, rec);
    return of(match).pipe(delay(500));
  }

  getPesticideUseReports(fieldId?: string): Observable<PesticideUseReport[]> {
    const list = fieldId ? this.pesticideUseReports.filter(pur => pur.fieldId === fieldId) : this.pesticideUseReports;
    return of(list).pipe(delay(800));
  }

  createPesticideUseReport(pur: Omit<PesticideUseReport, 'id' | 'status'>): Observable<PesticideUseReport> {
    const newPur: PesticideUseReport = {
      id: Math.random().toString(36).substring(2, 9),
      status: 'pending-submission',
      ...pur
    };
    this.pesticideUseReports.push(newPur);
    return of(newPur).pipe(delay(500));
  }
}
