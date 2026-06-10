import { Observable } from 'rxjs';
import { WeatherSnapshot, IrrigationEvent, SoilMoistureReading } from 'shared';

export abstract class WaterApi {
  abstract getWeather(ranchId?: string): Observable<WeatherSnapshot[]>;
  abstract getIrrigationEvents(fieldId?: string): Observable<IrrigationEvent[]>;
  abstract createIrrigationEvent(event: Omit<IrrigationEvent, 'id' | 'status'>): Observable<IrrigationEvent>;
  abstract updateIrrigationEvent(id: string, event: Partial<IrrigationEvent>): Observable<IrrigationEvent>;
  abstract getSoilMoisture(fieldId?: string): Observable<SoilMoistureReading[]>;
}
export const WATER_API_TOKEN = WaterApi;
