import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import WaterPage from './water';
import { WaterApi } from '../../core/services/api/water.api';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { ToastService } from '../../shared/services/toast/toast.service';

describe('WaterPage', () => {
  let component: WaterPage;
  let fixture: ComponentFixture<WaterPage>;

  const mockWaterApi = {
    getWeather: () => of([]),
    getIrrigationEvents: () => of([]),
    getSoilMoisture: () => of([]),
    createIrrigationEvent: () => of({} as any),
    updateIrrigationEvent: () => of({} as any)
  };

  const mockRanchesFieldsApi = {
    getRanches: () => of([]),
    getFields: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: WaterApi, useValue: mockWaterApi },
        { provide: RanchesFieldsApi, useValue: mockRanchesFieldsApi },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WaterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the water page component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize search and filter states', () => {
    const comp = component as any;
    expect(comp.statusFilter()).toBe('all');
    expect(comp.historicEtoTrend).toEqual([0.24, 0.28, 0.25, 0.31, 0.29, 0.33, 0.35]);
  });

  it('should build a valid irrigation schedule form', () => {
    const comp = component as any;
    expect(comp.waterForm).toBeDefined();
    const form = comp.waterForm;
    expect(form.get('fieldId')).toBeDefined();
    expect(form.get('appliedInches')?.value).toBe(0.45);
    expect(form.get('durationHours')?.value).toBe(12);
  });
});
