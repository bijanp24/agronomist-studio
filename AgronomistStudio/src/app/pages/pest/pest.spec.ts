import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import PestPage from './pest';
import { PestPcaApi } from '../../core/services/api/pest-pca.api';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { ToastService } from '../../shared/services/toast/toast.service';

describe('PestPage', () => {
  let component: PestPage;
  let fixture: ComponentFixture<PestPage>;

  const mockPestPcaApi = {
    getPestObservations: () => of([]),
    getSprayRecommendations: () => of([]),
    getPesticideUseReports: () => of([]),
    createSprayRecommendation: () => of({} as any),
    updateSprayRecommendation: () => of({} as any),
    createPesticideUseReport: () => of({} as any)
  };

  const mockRanchesFieldsApi = {
    getRanches: () => of([]),
    getFields: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PestPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: PestPcaApi, useValue: mockPestPcaApi },
        { provide: RanchesFieldsApi, useValue: mockRanchesFieldsApi },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the pest page component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states and static product reference database', () => {
    const comp = component as any;
    expect(comp.isDetailModalOpen()).toBeFalsy();
    expect(comp.isAddModalOpen()).toBeFalsy();
    expect(comp.prescribedMaterials()).toEqual([]);
    expect(comp.activeEpaNumber()).toBe('279-9611');
  });

  it('should construct a valid spray recommendation builder form', () => {
    const comp = component as any;
    expect(comp.recForm).toBeDefined();
    const form = comp.recForm;
    expect(form.get('fieldId')).toBeDefined();
    expect(form.get('pcaName')?.value).toBe('Sara Agronomy');
    expect(form.get('pcaLicense')?.value).toBe('PCA-88741');
  });
});
