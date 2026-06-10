import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import NutrientsPage from './nutrients';
import { NutrientsApi } from '../../core/services/api/nutrients.api';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { ToastService } from '../../shared/services/toast/toast.service';

describe('NutrientsPage', () => {
  let component: NutrientsPage;
  let fixture: ComponentFixture<NutrientsPage>;

  const mockNutrientsApi = {
    getSoilSamples: () => of([]),
    getTissueSamples: () => of([]),
    getNitrogenPlans: () => of([])
  };

  const mockRanchesFieldsApi = {
    getRanches: () => of([]),
    getFields: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutrientsPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: NutrientsApi, useValue: mockNutrientsApi },
        { provide: RanchesFieldsApi, useValue: mockRanchesFieldsApi },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NutrientsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the nutrients page component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states', () => {
    const comp = component as any;
    expect(comp.isModalOpen()).toBeFalsy();
    expect(comp.soilSamples()).toEqual([]);
    expect(comp.tissueSamples()).toEqual([]);
  });

  it('should build a valid soil and tissue lab log form', () => {
    const comp = component as any;
    expect(comp.nutrientForm).toBeDefined();
    const form = comp.nutrientForm;
    expect(form.get('fieldId')).toBeDefined();
    expect(form.get('category')?.value).toBe('soil');
  });
});
