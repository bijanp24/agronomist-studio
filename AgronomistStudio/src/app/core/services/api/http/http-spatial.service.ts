import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LatLon, LearningBlockResult, ElevationGrid, CarryingCapacityInputs } from 'shared';
import { SpatialApi } from '../spatial.api';

@Injectable({
  providedIn: 'root'
})
export class HttpSpatialService implements SpatialApi {
  private readonly http = inject(HttpClient);

  calculateBoundaryArea(ring: LatLon[], unit: 'acre' | 'hectare' = 'acre'): Observable<LearningBlockResult> {
    return this.http.post<LearningBlockResult>('/api/spatial/boundary-area', { ring, unit });
  }

  calculateTerrainFlow(grid: ElevationGrid): Observable<LearningBlockResult> {
    return this.http.post<LearningBlockResult>('/api/spatial/terrain-flow', grid);
  }

  calculateCarryingCapacity(inputs: CarryingCapacityInputs): Observable<LearningBlockResult> {
    return this.http.post<LearningBlockResult>('/api/spatial/carrying-capacity', inputs);
  }

  getDemoField(): Observable<any> {
    return this.http.get<any>('/api/spatial/demo');
  }
}
