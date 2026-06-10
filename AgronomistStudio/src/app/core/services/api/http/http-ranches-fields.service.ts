import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ranch, Field } from 'shared';
import { RanchesFieldsApi } from '../ranches-fields.api';

@Injectable({
  providedIn: 'root'
})
export class HttpRanchesFieldsService implements RanchesFieldsApi {
  private readonly http = inject(HttpClient);

  getRanches(): Observable<Ranch[]> {
    return this.http.get<Ranch[]>('/api/ranches');
  }

  getFields(ranchId?: string): Observable<Field[]> {
    const params: Record<string, string> = {};
    if (ranchId) {
      params['ranchId'] = ranchId;
    }
    return this.http.get<Field[]>('/api/fields', { params });
  }

  getFieldById(id: string): Observable<Field> {
    return this.http.get<Field>(`/api/fields/${id}`);
  }

  createField(field: Omit<Field, 'id' | 'createdAt'>): Observable<Field> {
    return this.http.post<Field>('/api/fields', field);
  }
}
