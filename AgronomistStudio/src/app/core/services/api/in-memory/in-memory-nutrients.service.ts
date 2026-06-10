import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { SoilSample, TissueSample, NitrogenPlan, mockSoilSamples, mockTissueSamples, mockNitrogenPlans } from 'shared';
import { NutrientsApi } from '../nutrients.api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryNutrientsService implements NutrientsApi {
  private soilSamples = [...mockSoilSamples];
  private tissueSamples = [...mockTissueSamples];
  private nitrogenPlans = [...mockNitrogenPlans];

  getSoilSamples(fieldId?: string): Observable<SoilSample[]> {
    const list = fieldId ? this.soilSamples.filter(s => s.fieldId === fieldId) : this.soilSamples;
    return of(list).pipe(delay(800));
  }

  getTissueSamples(fieldId?: string): Observable<TissueSample[]> {
    const list = fieldId ? this.tissueSamples.filter(t => t.fieldId === fieldId) : this.tissueSamples;
    return of(list).pipe(delay(800));
  }

  getNitrogenPlans(fieldId?: string): Observable<NitrogenPlan[]> {
    const list = fieldId ? this.nitrogenPlans.filter(p => p.fieldId === fieldId) : this.nitrogenPlans;
    return of(list).pipe(delay(800));
  }
}
