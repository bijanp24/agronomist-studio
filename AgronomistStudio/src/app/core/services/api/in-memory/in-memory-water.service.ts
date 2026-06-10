import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { WeatherSnapshot, IrrigationEvent, SoilMoistureReading, mockWeatherSnapshots, mockIrrigationEvents, mockSoilMoistureReadings } from 'shared';
import { WaterApi } from '../water.api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryWaterService implements WaterApi {
  private weather = [...mockWeatherSnapshots];
  private irrigationEvents: IrrigationEvent[] = [...mockIrrigationEvents];
  private soilMoisture = [...mockSoilMoistureReadings];

  getWeather(ranchId?: string): Observable<WeatherSnapshot[]> {
    const list = ranchId ? this.weather.filter(w => w.ranchId === ranchId) : this.weather;
    return of(list).pipe(delay(800));
  }

  getIrrigationEvents(fieldId?: string): Observable<IrrigationEvent[]> {
    const list = fieldId ? this.irrigationEvents.filter(ie => ie.fieldId === fieldId) : this.irrigationEvents;
    return of(list).pipe(delay(800));
  }

  createIrrigationEvent(event: Omit<IrrigationEvent, 'id' | 'status'>): Observable<IrrigationEvent> {
    const newEvent: IrrigationEvent = {
      id: Math.random().toString(36).substring(2, 9),
      status: 'scheduled',
      ...event
    };
    this.irrigationEvents.push(newEvent);
    return of(newEvent).pipe(delay(500));
  }

  updateIrrigationEvent(id: string, event: Partial<IrrigationEvent>): Observable<IrrigationEvent> {
    const match = this.irrigationEvents.find(ie => ie.id === id);
    if (!match) {
      throw new Error(`Irrigation event ${id} not found`);
    }
    Object.assign(match, event);
    return of(match).pipe(delay(500));
  }

  getSoilMoisture(fieldId?: string): Observable<SoilMoistureReading[]> {
    const list = fieldId ? this.soilMoisture.filter(sm => sm.fieldId === fieldId) : this.soilMoisture;
    return of(list).pipe(delay(800));
  }
}
