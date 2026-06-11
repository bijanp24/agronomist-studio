import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, forkJoin } from 'rxjs';
import { WeatherSnapshot, IrrigationEvent, SoilMoistureReading } from 'shared';
import { WaterApi } from '../services/api/water.api';

export interface WaterState {
  weatherSnapshots: WeatherSnapshot[];
  irrigationEvents: IrrigationEvent[];
  soilMoistureReadings: SoilMoistureReading[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WaterState = {
  weatherSnapshots: [],
  irrigationEvents: [],
  soilMoistureReadings: [],
  isLoading: false,
  error: null,
};

export const WaterStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, waterApi = inject(WaterApi)) => ({
    loadWaterTelemetry: rxMethod<string | null | void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((ranchId) => {
          const id = typeof ranchId === 'string' ? ranchId : undefined;
          return forkJoin({
            weather: waterApi.getWeather(id),
            irrigation: waterApi.getIrrigationEvents(),
            moisture: waterApi.getSoilMoisture()
          }).pipe(
            tap({
              next: (res) => patchState(store, {
                weatherSnapshots: res.weather,
                irrigationEvents: res.irrigation,
                soilMoistureReadings: res.moisture,
                isLoading: false
              }),
              error: (err: any) => patchState(store, { error: err.message || 'Unknown error', isLoading: false }),
            })
          );
        })
      )
    ),
    addIrrigationEvent(event: IrrigationEvent): void {
      patchState(store, (state) => ({ irrigationEvents: [event, ...state.irrigationEvents] }));
    },
    updateIrrigationEvent(event: IrrigationEvent): void {
      patchState(store, (state) => ({
        irrigationEvents: state.irrigationEvents.map(e => e.id === event.id ? event : e)
      }));
    }
  }))
);
