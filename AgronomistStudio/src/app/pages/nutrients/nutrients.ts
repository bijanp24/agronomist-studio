import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { NutrientsApi } from '../../core/services/api/nutrients.api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { SoilSample, TissueSample, NitrogenPlan, Field } from 'shared';

// Import UI Kit
import { StatCardComponent, BadgeComponent, SkeletonComponent, DataTableComponent, ModalComponent } from '../../shared';

export interface FormattedSoilSample extends SoilSample {
  fieldName: string;
  crop: string;
}

export interface FormattedTissueSample extends TissueSample {
  fieldName: string;
  crop: string;
}

export interface FormattedNitrogenPlan extends NitrogenPlan {
  fieldName: string;
  crop: string;
}

@Component({
  selector: 'app-nutrients',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatCardComponent,
    BadgeComponent,
    SkeletonComponent,
    DataTableComponent,
    ModalComponent
  ],
  templateUrl: './nutrients.html'
})
export default class NutrientsPage implements OnInit {
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly nutrientsApi = inject(NutrientsApi);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // API datasets cached state signals
  protected readonly soilSamples = signal<SoilSample[]>([]);
  protected readonly tissueSamples = signal<TissueSample[]>([]);
  protected readonly nitrogenPlans = signal<NitrogenPlan[]>([]);
  protected readonly loading = signal<boolean>(false);

  // Log Form states
  protected nutrientForm!: FormGroup;
  protected readonly isModalOpen = signal<boolean>(false);

  // standard static Math reference
  protected readonly Math = Math;

  // Grid headers columns definition
  protected readonly soilColumns = [
    { key: 'fieldName', label: 'Field boundary', sortable: true },
    { key: 'sampleDate', label: 'Sample Date', sortable: true },
    { key: 'nitrogenPpm', label: 'Nitrogen (N)', sortable: true },
    { key: 'phosphorusPpm', label: 'Phosphorus (P)', sortable: true },
    { key: 'potassiumPpm', label: 'Potassium (K)', sortable: true },
    { key: 'organicMatterPct', label: 'OM %', sortable: true },
    { key: 'ph', label: 'pH Index', sortable: true },
    { key: 'status', label: 'Evaluation', sortable: true }
  ];

  protected readonly tissueColumns = [
    { key: 'fieldName', label: 'Field block', sortable: true },
    { key: 'sampleDate', label: 'Sample Date', sortable: true },
    { key: 'nitrogenPct', label: 'Nitrogen %', sortable: true },
    { key: 'phosphorusPct', label: 'Phosphorus %', sortable: true },
    { key: 'potassiumPct', label: 'Potassium %', sortable: true },
    { key: 'zincPpm', label: 'Zinc (Zn)', sortable: true },
    { key: 'status', label: 'Deficiency Diagnostic', sortable: true }
  ];

  constructor() {
    this.initNutrientForm();

    // Re-sync local dataset caches when global Selected ranch changes
    effect(() => {
      const ranchId = this.ranchStore.selectedRanchId();
      this.loadNutrientsTelemetry(ranchId);
    });
  }

  ngOnInit() {
    const ranchId = this.ranchStore.selectedRanchId();
    this.loadNutrientsTelemetry(ranchId);
  }

  private loadNutrientsTelemetry(ranchId: string | null) {
    this.loading.set(true);

    const soil$ = this.nutrientsApi.getSoilSamples();
    const tissue$ = this.nutrientsApi.getTissueSamples();
    const nitrogen$ = this.nutrientsApi.getNitrogenPlans();

    forkJoin({
      soil: soil$,
      tissue: tissue$,
      nitrogen: nitrogen$
    }).subscribe({
      next: (res) => {
        this.soilSamples.set(res.soil);
        this.tissueSamples.set(res.tissue);
        this.nitrogenPlans.set(res.nitrogen);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to sync laboratory records', err);
        this.toastService.danger('Failed to sync laboratory analytical sheets. Please reload page.');
        this.loading.set(false);
      }
    });
  }

  // --- Dynamic Search & Filter computations ---

  private readonly activeFieldIds = computed(() => {
    return new Set(this.fieldStore.fields().map(f => f.id));
  });

  // Mapped Soil core samples
  protected readonly formattedSoilSamples = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.soilSamples()
      .filter(s => activeIds.has(s.fieldId))
      .map(s => {
        const field = fields.find(f => f.id === s.fieldId);
        return {
          ...s,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop'
        } as FormattedSoilSample;
      })
      .sort((a, b) => b.sampleDate.localeCompare(a.sampleDate));
  });

  // Mapped Crop Foliar tissue assays
  protected readonly formattedTissueSamples = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.tissueSamples()
      .filter(t => activeIds.has(t.fieldId))
      .map(t => {
        const field = fields.find(f => f.id === t.fieldId);
        return {
          ...t,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop'
        } as FormattedTissueSample;
      })
      .sort((a, b) => b.sampleDate.localeCompare(a.sampleDate));
  });

  // Mapped Nitrogen Management Plans (NMP)
  protected readonly formattedNitrogenPlans = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.nitrogenPlans()
      .filter(p => activeIds.has(p.fieldId))
      .map(p => {
        const field = fields.find(f => f.id === p.fieldId);
        return {
          ...p,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop'
        } as FormattedNitrogenPlan;
      });
  });

  // --- Dynamic metrics summary computations ---

  protected readonly avgNitrogenBudgetValue = computed(() => {
    const plans = this.formattedNitrogenPlans();
    if (plans.length === 0) return '0 lbs';
    const sum = plans.reduce((acc, p) => acc + p.budgetedN_lbsPerAcre, 0);
    return `${Math.round(sum / plans.length)} lbs/ac`;
  });

  protected readonly deficientSamplesCount = computed(() => {
    return this.formattedTissueSamples().filter(t => t.status === 'deficient').length;
  });

  protected readonly deficientSamplesValue = computed(() => {
    const count = this.deficientSamplesCount();
    return `${count} Deficient Lab Assay${count === 1 ? '' : 's'}`;
  });

  protected readonly lowSoilNCount = computed(() => {
    return this.formattedSoilSamples().filter(s => s.nitrogenPpm < 10).length;
  });

  protected readonly lowSoilNValue = computed(() => {
    const count = this.lowSoilNCount();
    return `${count} Low Nitrate Block${count === 1 ? '' : 's'}`;
  });

  protected readonly totalAssaysValue = computed(() => {
    const count = this.formattedSoilSamples().length + this.formattedTissueSamples().length;
    return `${count} Analytical Assays`;
  });

  protected readonly activeFieldsCoverageTrend = computed(() => {
    const coveredIds = new Set([
      ...this.formattedSoilSamples().map(s => s.fieldId),
      ...this.formattedTissueSamples().map(t => t.fieldId)
    ]);
    const totalFields = this.fieldStore.fields().length;
    return `${coveredIds.size} of ${totalFields} Fields Mapped`;
  });

  // --- Interactive Slider credit adjustments ---

  protected onCreditSlide(plan: FormattedNitrogenPlan, event: Event) {
    const slider = event.target as HTMLInputElement;
    const value = parseInt(slider.value) || 0;

    // Dynamically adjust NMP state locally to model balanced Nitrogen curves
    this.nitrogenPlans.update(list => {
      return list.map(item => {
        if (item.id === plan.id) {
          return {
            ...item,
            creditsResidualN_lbsPerAcre: value
          };
        }
        return item;
      });
    });
  }

  // --- Dynamic Form Creation ---

  private initNutrientForm() {
    this.nutrientForm = this.fb.group({
      fieldId: ['', [Validators.required]],
      category: ['soil', [Validators.required]],
      labSampleNumber: ['', [Validators.required, Validators.minLength(4)]],
      sampleDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      
      // Soil Minerals sub-controls
      soilN: [15, [Validators.min(0), Validators.max(500)]],
      soilP: [25, [Validators.min(0), Validators.max(500)]],
      soilK: [140, [Validators.min(0), Validators.max(1000)]],
      soilOM: [1.8, [Validators.min(0.1), Validators.max(20.0)]],
      soilPh: [6.8, [Validators.min(4.0), Validators.max(10.0)]],
      
      // Tissue Minerals sub-controls
      tissueN: [2.5, [Validators.min(0.1), Validators.max(10.0)]],
      tissueP: [0.25, [Validators.min(0.01), Validators.max(2.0)]],
      tissueK: [1.5, [Validators.min(0.1), Validators.max(5.0)]],
      tissueZn: [24, [Validators.min(1), Validators.max(500)]]
    });
  }

  protected openAddSampleModal() {
    this.isModalOpen.set(true);
  }

  protected closeAddSampleModal() {
    this.isModalOpen.set(false);
    this.nutrientForm.reset({
      category: 'soil',
      sampleDate: new Date().toISOString().substring(0, 10),
      soilN: 15,
      soilP: 25,
      soilK: 140,
      soilOM: 1.8,
      soilPh: 6.8,
      tissueN: 2.5,
      tissueP: 0.25,
      tissueK: 1.5,
      tissueZn: 24
    });
  }

  protected submitSampleForm() {
    if (this.nutrientForm.invalid) return;

    const formVal = this.nutrientForm.value;
    const cat = formVal.category;

    if (cat === 'soil') {
      const payload: Omit<SoilSample, 'id'> = {
        fieldId: formVal.fieldId,
        sampleDate: formVal.sampleDate,
        labSampleNumber: formVal.labSampleNumber,
        nitrogenPpm: formVal.soilN,
        phosphorusPpm: formVal.soilP,
        potassiumPpm: formVal.soilK,
        organicMatterPct: formVal.soilOM,
        ph: formVal.soilPh,
        status: formVal.soilN < 10 ? 'low' : (formVal.soilN > 30 ? 'high' : 'optimal')
      };

      // Simulate soil core saving locally
      this.soilSamples.update(list => [payload as SoilSample, ...list]);
      this.toastService.success(`Soil Mineral analysis submitted! Indices recalculated for Field Block.`);
    } else {
      const payload: Omit<TissueSample, 'id'> = {
        fieldId: formVal.fieldId,
        sampleDate: formVal.sampleDate,
        nitrogenPct: formVal.tissueN,
        phosphorusPct: formVal.tissueP,
        potassiumPct: formVal.tissueK,
        zincPpm: formVal.tissueZn,
        status: formVal.tissueZn < 20 ? 'deficient' : (formVal.tissueZn > 45 ? 'excessive' : 'adequate')
      };

      // Simulate tissue core saving locally
      this.tissueSamples.update(list => [payload as TissueSample, ...list]);
      this.toastService.success(`Foliar Crop Tissue assay logged! Deficiency diagnostics generated.`);
    }

    this.closeAddSampleModal();
  }
}
