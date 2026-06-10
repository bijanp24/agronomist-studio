import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import DashboardPage from './dashboard';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { WaterApi } from '../../core/services/api/water.api';
import { ScoutingApi } from '../../core/services/api/scouting.api';
import { PestPcaApi } from '../../core/services/api/pest-pca.api';
import { ToastService } from '../../shared/services/toast/toast.service';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let toastService: ToastService;

  // Mock API implementations
  const mockRanchesFieldsApi = {
    getRanches: () => of([]),
    getFields: () => of([]),
    getFieldById: () => of({} as any),
    createField: () => of({} as any)
  };

  const mockWaterApi = {
    getWeather: () => of([]),
    getIrrigationEvents: () => of([]),
    getSoilMoisture: () => of([])
  };

  const mockScoutingApi = {
    getReports: () => of([])
  };

  const mockPestPcaApi = {
    getSprayRecommendations: () => of([]),
    getPestObservations: () => of([]),
    getPesticideUseReports: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        { provide: RanchesFieldsApi, useValue: mockRanchesFieldsApi },
        { provide: WaterApi, useValue: mockWaterApi },
        { provide: ScoutingApi, useValue: mockScoutingApi },
        { provide: PestPcaApi, useValue: mockPestPcaApi },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create the dashboard page component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states and values', () => {
    const comp = component as any;
    expect(comp.isModalOpen()).toBeFalsy();
    expect(comp.selectedRecommendation()).toBeNull();
    expect(comp.historicEtoTrend).toEqual([0.24, 0.28, 0.25, 0.31, 0.29, 0.33, 0.35]);
  });
});
