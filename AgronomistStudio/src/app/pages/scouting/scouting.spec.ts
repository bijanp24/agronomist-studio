import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import ScoutingPage from './scouting';
import { ScoutingApi } from '../../core/services/api/scouting.api';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { ToastService } from '../../shared/services/toast/toast.service';

describe('ScoutingPage', () => {
  let component: ScoutingPage;
  let fixture: ComponentFixture<ScoutingPage>;

  const mockScoutingApi = {
    getReports: () => of([]),
    createReport: () => of({} as any)
  };

  const mockRanchesFieldsApi = {
    getRanches: () => of([]),
    getFields: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoutingPage, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: ScoutingApi, useValue: mockScoutingApi },
        { provide: RanchesFieldsApi, useValue: mockRanchesFieldsApi },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoutingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the scouting page', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with filters set to all', () => {
    const comp = component as any;
    expect(comp.searchQuery()).toBe('');
    expect(comp.severityFilter()).toBe('all');
    expect(comp.cropFilter()).toBe('all');
  });

  it('should build a valid scouting form', () => {
    const comp = component as any;
    expect(comp.scoutForm).toBeDefined();
    const form = comp.scoutForm;
    expect(form.get('fieldId')).toBeDefined();
    expect(form.get('scouterName')).toBeDefined();
    expect(form.get('severity')?.value).toBe('low');
  });
});
