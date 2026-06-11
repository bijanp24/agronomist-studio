import { Observable } from 'rxjs';
import { LatLon, LearningBlockResult, ElevationGrid, CarryingCapacityInputs } from 'shared';

export abstract class SpatialApi {
  abstract calculateBoundaryArea(ring: LatLon[], unit?: 'acre' | 'hectare'): Observable<LearningBlockResult>;
  abstract calculateTerrainFlow(grid: ElevationGrid): Observable<LearningBlockResult>;
  abstract calculateCarryingCapacity(inputs: CarryingCapacityInputs): Observable<LearningBlockResult>;
  abstract getDemoField(): Observable<any>;
}
