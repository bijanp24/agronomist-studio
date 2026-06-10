import { Observable } from 'rxjs';
import { PlantingPlan, HarvestRecord, YieldRecord } from 'shared';

export abstract class CropPlanningApi {
  abstract getPlantingPlans(fieldId?: string): Observable<PlantingPlan[]>;
  abstract getHarvestRecords(fieldId?: string): Observable<HarvestRecord[]>;
  abstract getYieldRecords(fieldId?: string): Observable<YieldRecord[]>;
}
export const CROP_PLANNING_API_TOKEN = CropPlanningApi;
