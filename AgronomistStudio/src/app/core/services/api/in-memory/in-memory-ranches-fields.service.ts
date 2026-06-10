import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Ranch, Field, mockRanches, mockFields } from 'shared';
import { RanchesFieldsApi } from '../ranches-fields.api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryRanchesFieldsService implements RanchesFieldsApi {
  private ranches: Ranch[] = [...mockRanches];
  private fields: Field[] = [...mockFields];

  getRanches(): Observable<Ranch[]> {
    return of(this.ranches).pipe(delay(800));
  }

  getFields(ranchId?: string): Observable<Field[]> {
    const list = ranchId ? this.fields.filter(f => f.ranchId === ranchId) : this.fields;
    return of(list).pipe(delay(800));
  }

  getFieldById(id: string): Observable<Field> {
    const field = this.fields.find(f => f.id === id);
    if (!field) {
      throw new Error(`Field with id ${id} not found`);
    }
    return of(field).pipe(delay(500));
  }

  createField(field: Omit<Field, 'id' | 'createdAt'>): Observable<Field> {
    const newField: Field = {
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      ...field
    };
    this.fields.push(newField);
    return of(newField).pipe(delay(500));
  }
}
