import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import PlanningPage from './planning';
import { CropPlanningApi } from '../../core/services/api/crop-planning.api';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { ToastService } from '../../shared/services/toast/toast.service';

describe('PlanningPage', () => {
  let component: PlanningPage;
  let fixture: ComponentFixture<PlanningPage>;

  const mockCropPlanningApi = {
    getPlantingPlans: () => of([]),
    getHarvestRecords: () => of([]),
    getYieldRecords: () => of([])
  };

  const mockRanchesFieldsApi = {
    getRanches: () => of([]),
    getFields: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanningPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: CropPlanningApi, useValue: mockCropPlanningApi },
        { provide: RanchesFieldsApi, useValue: mockRanchesFieldsApi },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanningPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the crop planning page component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states', () => {
    const comp = component as any;
    expect(comp.isPlantingModalOpen()).toBeFalsy();
    expect(comp.isHarvestModalOpen()).toBeFalsy();
    expect(comp.plantingPlans()).toEqual([]);
    expect(comp.harvestRecords()).toEqual([]);
  });

  it('should build valid planting and harvest forms', () => {
    const comp = component as any;
    expect(comp.plantingForm).toBeDefined();
    expect(comp.harvestForm).toBeDefined();
    
    const formP = comp.plantingForm;
    expect(formP.get('fieldId')).toBeDefined();
    expect(formP.get('crop')).toBeDefined();

    const formH = comp.harvestForm;
    expect(formH.get('fieldId')).toBeDefined();
    expect(formH.get('totalYieldAmount')).toBeDefined();
  });
});
