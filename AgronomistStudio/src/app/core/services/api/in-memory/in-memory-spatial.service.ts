import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { LatLon, LearningBlockResult, ElevationGrid, CarryingCapacityInputs, FieldLayer } from 'shared';
import { SpatialApi } from '../spatial.api';

@Injectable({
  providedIn: 'root'
})
export class InMemorySpatialService implements SpatialApi {
  calculateBoundaryArea(ring: LatLon[], unit: 'acre' | 'hectare' = 'acre'): Observable<LearningBlockResult> {
    const areaAcres = 42.3;
    const areaHectares = areaAcres * 0.404686;
    const perimeterMiles = 2.61;
    const perimeterKm = perimeterMiles * 1.60934;

    const outputLayer: FieldLayer = {
      id: 'output-boundary-area',
      name: 'Field Boundary (Mock)',
      type: 'boundary',
      geometry: {
        type: 'Polygon',
        coordinates: [[...ring.map((p) => [p.lon, p.lat]), [ring[0].lon, ring[0].lat]]],
      },
      attributes: {
        areaAcres,
        areaHectares,
        perimeterMiles,
        perimeterKm,
      },
      source: 'in-memory-spatial',
    };

    const result: LearningBlockResult = {
      blockId: 'boundary-area',
      computed: {
        areaAcres,
        areaHectares,
        perimeterMiles,
        perimeterKm,
        vertexCount: ring.length,
      },
      outputLayers: [outputLayer],
      explanation: `This field covers ${areaAcres.toFixed(2)} acres with a perimeter of ${perimeterMiles.toFixed(2)} miles. (In-Memory Simulation)`
    };

    return of(result).pipe(delay(600));
  }

  calculateTerrainFlow(grid: ElevationGrid): Observable<LearningBlockResult> {
    const result: LearningBlockResult = {
      blockId: 'terrain-flow',
      computed: {
        minSlopePercent: 0.8,
        maxSlopePercent: 5.4,
        avgSlopePercent: 2.3,
        poolingZoneCount: 1,
        runoffZoneCount: 2,
        analyzedPoints: 9,
      },
      outputLayers: [
        {
          id: 'output-terrain-slope',
          name: 'Terrain Slope (Mock)',
          type: 'terrain',
          attributes: { points: [], avgSlopePercent: 2.3 },
          source: 'in-memory-spatial',
        }
      ],
      explanation: 'Average slope is 2.3% (range 0.8%–5.4%). 1 pooling zone and 2 runoff-risk zones identified. (In-Memory Simulation)'
    };
    return of(result).pipe(delay(700));
  }

  calculateCarryingCapacity(inputs: CarryingCapacityInputs): Observable<LearningBlockResult> {
    const result: LearningBlockResult = {
      blockId: 'carrying-capacity',
      computed: {
        finalPopulation: 182,
        carryingCapacity: 200,
        percentOfCarryingCapacity: 91.0,
        steps: 20,
      },
      outputLayers: [],
      explanation: 'After 20 time steps the population reached 182, which is 91.0% of carrying capacity (K = 200). (In-Memory Simulation)'
    };
    return of(result).pipe(delay(600));
  }

  getDemoField(): Observable<any> {
    const demo = {
      field: {
        id: 'demo-field-001',
        name: 'Sunrise Ranch – Block A (Mock)',
        region: 'San Joaquin Valley, CA',
        area: { value: 42.3, unit: 'acre' },
        boundary: {
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-119.9200, 36.7400],
                [-119.9100, 36.7400],
                [-119.9100, 36.7320],
                [-119.9200, 36.7320],
                [-119.9200, 36.7400]
              ]
            ]
          }
        }
      }
    };
    return of(demo).pipe(delay(400));
  }
}
