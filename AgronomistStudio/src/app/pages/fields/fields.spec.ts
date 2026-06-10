import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { vi } from 'vitest';
import FieldsPage from './fields';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { WaterApi } from '../../core/services/api/water.api';
import { ScoutingApi } from '../../core/services/api/scouting.api';
import { PestPcaApi } from '../../core/services/api/pest-pca.api';
import { NutrientsApi } from '../../core/services/api/nutrients.api';
import { CropPlanningApi } from '../../core/services/api/crop-planning.api';
import { ToastService } from '../../shared/services/toast/toast.service';

// Mock maplibregl.Map using Vitest's vi.mock
vi.mock('maplibre-gl', () => {
  return {
    default: {
      Map: vi.fn().mockImplementation(() => {
        return {
          addControl: vi.fn(),
          on: vi.fn(),
          remove: vi.fn(),
          getSource: vi.fn().mockReturnValue({
            setData: vi.fn()
          }),
          fitBounds: vi.fn(),
          setCenter: vi.fn(),
          setZoom: vi.fn(),
          addSource: vi.fn(),
          addLayer: vi.fn(),
          getCanvas: vi.fn().mockReturnValue({
            style: {}
          })
        };
      }),
      NavigationControl: vi.fn(),
      Popup: vi.fn().mockImplementation(() => {
        return {
          setLngLat: vi.fn().mockReturnThis(),
          setHTML: vi.fn().mockReturnThis(),
          addTo: vi.fn().mockReturnThis(),
          remove: vi.fn()
        };
      }),
      LngLatBounds: vi.fn().mockImplementation(() => {
        return {
          extend: vi.fn().mockReturnThis()
        };
      })
    }
  };
});

describe('FieldsPage', () => {
  let component: FieldsPage;
  let fixture: ComponentFixture<FieldsPage>;

  const mockRanchesFieldsApi = {
    getRanches: () => of([]),
    getFields: () => of([]),
    getFieldById: () => of({} as any),
    createField: () => of({ id: 'new-f', name: 'Test' } as any)
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

  const mockNutrientsApi = {
    getSoilSamples: () => of([]),
    getTissueSamples: () => of([]),
    getNitrogenPlans: () => of([])
  };

  const mockCropPlanningApi = {
    getPlantingPlans: () => of([]),
    getHarvestRecords: () => of([]),
    getYieldRecords: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldsPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: RanchesFieldsApi, useValue: mockRanchesFieldsApi },
        { provide: WaterApi, useValue: mockWaterApi },
        { provide: ScoutingApi, useValue: mockScoutingApi },
        { provide: PestPcaApi, useValue: mockPestPcaApi },
        { provide: NutrientsApi, useValue: mockNutrientsApi },
        { provide: CropPlanningApi, useValue: mockCropPlanningApi },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the fields page component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize search and filter states', () => {
    const comp = component as any;
    expect(comp.localSearchQuery()).toBe('');
    expect(comp.statusFilter()).toBe('all');
  });

  it('should create valid form for registered fields', () => {
    const comp = component as any;
    expect(comp.fieldForm).toBeDefined();
    const form = comp.fieldForm;
    expect(form.get('name')).toBeDefined();
    expect(form.get('crop')?.value).toBe('Almonds');
  });
});
