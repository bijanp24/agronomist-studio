import { Observable } from 'rxjs';
import { Ranch, Field } from 'shared';

export abstract class RanchesFieldsApi {
  abstract getRanches(): Observable<Ranch[]>;
  abstract getFields(ranchId?: string): Observable<Field[]>;
  abstract getFieldById(id: string): Observable<Field>;
  abstract createField(field: Omit<Field, 'id' | 'createdAt'>): Observable<Field>;
}
export const RANCHES_FIELDS_API_TOKEN = RanchesFieldsApi;
