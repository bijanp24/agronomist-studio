import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeatherSnapshot, IrrigationEvent, SoilMoistureReading } from 'shared';
import { WaterApi } from '../water.api';

@Injectable({
  providedIn: 'root'
})
export class HttpWaterService implements WaterApi {
  private readonly http = inject(HttpClient);

  getWeather(ranchId?: string): Observable<WeatherSnapshot[]> {
    const params: Record<string, string> = {};
    if (ranchId) {
      params['ranchId'] = ranchId;
    }
    return this.http.get<WeatherSnapshot[]>('/api/weather', { params });
  }

  getIrrigationEvents(fieldId?: string): Observable<IrrigationEvent[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<IrrigationEvent[]>('/api/irrigation-events', { params });
  }

  createIrrigationEvent(event: Omit<IrrigationEvent, 'id' | 'status'>): Observable<IrrigationEvent> {
    return this.http.post<IrrigationEvent>('/api/irrigation-events', event);
  }

  updateIrrigationEvent(id: string, event: Partial<IrrigationEvent>): Observable<IrrigationEvent> {
    return this.http.patch<IrrigationEvent>(`/api/irrigation-events/${id}`, event);
  }

  getSoilMoisture(fieldId?: string): Observable<SoilMoistureReading[]> {
    const params: Record<string, string> = {};
    if (fieldId) {
      params['fieldId'] = fieldId;
    }
    return this.http.get<SoilMoistureReading[]>('/api/soil-moisture', { params });
  }
}
