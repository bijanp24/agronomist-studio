import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Field } from '../models/field.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly mockFields: Field[] = [
    {
      id: 'f1',
      name: 'North 40',
      crop: 'Corn',
      areaAcres: 40.5,
      status: 'healthy',
      lastScouted: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    {
      id: 'f2',
      name: 'River Bottom',
      crop: 'Soybeans',
      areaAcres: 120.0,
      status: 'needs-attention',
      lastScouted: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
    },
    {
      id: 'f3',
      name: 'East Hill',
      crop: 'Wheat',
      areaAcres: 85.2,
      status: 'critical',
      lastScouted: new Date(Date.now() - 86400000 * 10).toISOString() // 10 days ago
    },
    {
      id: 'f4',
      name: 'Home Section',
      crop: 'Corn',
      areaAcres: 65.0,
      status: 'healthy',
      lastScouted: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago
    }
  ];

  getFields(): Observable<Field[]> {
    // Simulate network latency of 800ms
    return of(this.mockFields).pipe(delay(800));
  }

  getFieldById(id: string): Observable<Field | undefined> {
    const field = this.mockFields.find(f => f.id === id);
    return of(field).pipe(delay(500));
  }
}
