import { Observable } from 'rxjs';
import { SoilSample, TissueSample, NitrogenPlan } from 'shared';

export abstract class NutrientsApi {
  abstract getSoilSamples(fieldId?: string): Observable<SoilSample[]>;
  abstract getTissueSamples(fieldId?: string): Observable<TissueSample[]>;
  abstract getNitrogenPlans(fieldId?: string): Observable<NitrogenPlan[]>;
}
export const NUTRIENTS_API_TOKEN = NutrientsApi;
