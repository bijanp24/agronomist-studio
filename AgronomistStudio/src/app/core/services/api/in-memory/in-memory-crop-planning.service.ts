import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PlantingPlan, HarvestRecord, YieldRecord, mockPlantingPlans, mockHarvestRecords, mockYieldRecords } from 'shared';
import { CropPlanningApi } from '../crop-planning.api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryCropPlanningService implements CropPlanningApi {
  private plantingPlans = [...mockPlantingPlans];
  private harvestRecords = [...mockHarvestRecords];
  private yieldRecords = [...mockYieldRecords];

  getPlantingPlans(fieldId?: string): Observable<PlantingPlan[]> {
    const list = fieldId ? this.plantingPlans.filter(p => p.fieldId === fieldId) : this.plantingPlans;
    return of(list).pipe(delay(800));
  }

  getHarvestRecords(fieldId?: string): Observable<HarvestRecord[]> {
    const list = fieldId ? this.harvestRecords.filter(h => h.fieldId === fieldId) : this.harvestRecords;
    return of(list).pipe(delay(800));
  }

  getYieldRecords(fieldId?: string): Observable<YieldRecord[]> {
    const list = fieldId ? this.yieldRecords.filter(y => y.fieldId === fieldId) : this.yieldRecords;
    return of(list).pipe(delay(800));
  }
}
