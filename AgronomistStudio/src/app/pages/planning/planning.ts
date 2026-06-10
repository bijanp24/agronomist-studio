import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { CropPlanningApi } from '../../core/services/api/crop-planning.api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { PlantingPlan, HarvestRecord, YieldRecord } from 'shared';

// Import UI Kit Components
import { StatCardComponent, BadgeComponent, SkeletonComponent, DataTableComponent, ModalComponent } from '../../shared';

export interface FormattedPlantingPlan extends PlantingPlan {
  fieldName: string;
}

export interface FormattedHarvestRecord extends HarvestRecord {
  fieldName: string;
}

export interface FormattedYieldRecord extends YieldRecord {
  fieldName: string;
}

@Component({
  selector: 'app-planning',
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
  templateUrl: './planning.html'
})
export default class PlanningPage implements OnInit {
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly cropPlanningApi = inject(CropPlanningApi);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // Cached API state signals
  protected readonly plantingPlans = signal<PlantingPlan[]>([]);
  protected readonly harvestRecords = signal<HarvestRecord[]>([]);
  protected readonly yieldRecords = signal<YieldRecord[]>([]);
  protected readonly loading = signal<boolean>(false);

  // Modal view states
  protected readonly isPlantingModalOpen = signal<boolean>(false);
  protected readonly isHarvestModalOpen = signal<boolean>(false);

  // Reactive Forms
  protected plantingForm!: FormGroup;
  protected harvestForm!: FormGroup;

  // standard Math reference for template
  protected readonly Math = Math;

  // Data table columns
  protected readonly plantingColumns = [
    { key: 'fieldName', label: 'Field block', sortable: true },
    { key: 'crop', label: 'Crop / Variety', sortable: true },
    { key: 'targetPlantingDate', label: 'Planting Dates', sortable: true },
    { key: 'targetHarvestDate', label: 'Target Harvest', sortable: true },
    { key: 'status', label: 'Cycle Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  protected readonly harvestColumns = [
    { key: 'fieldName', label: 'Field Block', sortable: true },
    { key: 'harvestDate', label: 'Harvest Date', sortable: true },
    { key: 'totalYieldAmount', label: 'Total Yield Weight', sortable: true },
    { key: 'qualityGrade', label: 'Quality Grade', sortable: true },
    { key: 'operatorName', label: 'Harvester Crew', sortable: true }
  ];

  constructor() {
    this.initForms();

    // Re-trigger API syncs when active ranch selection is modified
    effect(() => {
      const ranchId = this.ranchStore.selectedRanchId();
      this.loadPlanningData(ranchId);
    });
  }

  ngOnInit() {
    const ranchId = this.ranchStore.selectedRanchId();
    this.loadPlanningData(ranchId);
  }

  private loadPlanningData(ranchId: string | null) {
    this.loading.set(true);

    const plans$ = this.cropPlanningApi.getPlantingPlans();
    const harvests$ = this.cropPlanningApi.getHarvestRecords();
    const yields$ = this.cropPlanningApi.getYieldRecords();

    forkJoin({
      plans: plans$,
      harvests: harvests$,
      yields: yields$
    }).subscribe({
      next: (res) => {
        this.plantingPlans.set(res.plans);
        this.harvestRecords.set(res.harvests);
        this.yieldRecords.set(res.yields);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load crop planning streams', err);
        this.toastService.danger('Failed to synchronize crop scheduling datasets.');
        this.loading.set(false);
      }
    });
  }

  // --- Search & Filter computations ---

  private readonly activeFieldIds = computed(() => {
    return new Set(this.fieldStore.fields().map(f => f.id));
  });

  protected readonly formattedPlantingPlans = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.plantingPlans()
      .filter(p => activeIds.has(p.fieldId))
      .map(p => {
        const field = fields.find(f => f.id === p.fieldId);
        return {
          ...p,
          fieldName: field ? field.name : 'Unknown Field'
        } as FormattedPlantingPlan;
      })
      .sort((a, b) => b.targetPlantingDate.localeCompare(a.targetPlantingDate));
  });

  protected readonly formattedHarvestRecords = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.harvestRecords()
      .filter(h => activeIds.has(h.fieldId))
      .map(h => {
        const field = fields.find(f => f.id === h.fieldId);
        return {
          ...h,
          fieldName: field ? field.name : 'Unknown Field'
        } as FormattedHarvestRecord;
      })
      .sort((a, b) => b.harvestDate.localeCompare(a.harvestDate));
  });

  protected readonly formattedYieldRecords = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.yieldRecords()
      .filter(y => activeIds.has(y.fieldId))
      .map(y => {
        const field = fields.find(f => f.id === y.fieldId);
        return {
          ...y,
          fieldName: field ? field.name : 'Unknown Field'
        } as FormattedYieldRecord;
      })
      .sort((a, b) => b.cropYear - a.cropYear);
  });

  // --- Summary Metrics computations ---

  protected readonly totalPlannedAcreageValue = computed(() => {
    const activeIds = this.activeFieldIds();
    const fields = this.fieldStore.fields();
    
    // Sum acreage of all fields under active planning cycles
    const activePlans = this.plantingPlans().filter(p => activeIds.has(p.fieldId) && p.status !== 'cancelled');
    const uniquelyPlannedFieldIds = new Set(activePlans.map(p => p.fieldId));

    let sum = 0;
    uniquelyPlannedFieldIds.forEach(id => {
      const f = fields.find(field => field.id === id);
      if (f) sum += f.areaAcres;
    });

    return `${sum.toLocaleString()} Acres`;
  });

  protected readonly activeCyclesCount = computed(() => {
    const activeIds = this.activeFieldIds();
    return this.plantingPlans().filter(p => activeIds.has(p.fieldId) && p.status === 'planted').length;
  });

  protected readonly harvestLogsCount = computed(() => {
    return this.formattedHarvestRecords().length;
  });

  protected readonly avgYieldAcreAlmonds = computed(() => {
    const records = this.formattedYieldRecords().filter(y => y.crop.toLowerCase().includes('almond'));
    if (records.length === 0) return '0.0 Tons';
    const sum = records.reduce((acc, r) => acc + r.avgYieldPerAcre, 0);
    return `${(sum / records.length).toFixed(2)} Tons`;
  });

  // --- Form & Action Triggers ---

  private initForms() {
    this.plantingForm = this.fb.group({
      fieldId: ['', [Validators.required]],
      cropYear: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2050)]],
      crop: ['', [Validators.required]],
      variety: ['', [Validators.required, Validators.minLength(2)]],
      targetPlantingDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      targetHarvestDate: ['', [Validators.required]]
    });

    this.harvestForm = this.fb.group({
      fieldId: ['', [Validators.required]],
      cropYear: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2050)]],
      crop: ['', [Validators.required]],
      variety: [''],
      harvestDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      totalYieldAmount: [0, [Validators.required, Validators.min(1)]],
      yieldUnit: ['tons', [Validators.required]],
      qualityGrade: ['Select', [Validators.required]],
      operatorName: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  protected onFieldChange() {
    const fId = this.plantingForm.get('fieldId')?.value;
    const fields = this.fieldStore.fields();
    const field = fields.find(f => f.id === fId);

    if (field) {
      this.plantingForm.patchValue({
        crop: field.crop
      });
    } else {
      this.plantingForm.patchValue({
        crop: ''
      });
    }
  }

  protected onHarvestFieldChange() {
    const fId = this.harvestForm.get('fieldId')?.value;
    const fields = this.fieldStore.fields();
    const field = fields.find(f => f.id === fId);

    if (field) {
      this.harvestForm.patchValue({
        crop: field.crop
      });
    } else {
      this.harvestForm.patchValue({
        crop: ''
      });
    }
  }

  protected openAddPlantingModal() {
    this.isPlantingModalOpen.set(true);
  }

  protected closeAddPlantingModal() {
    this.isPlantingModalOpen.set(false);
    this.plantingForm.reset({
      cropYear: new Date().getFullYear(),
      targetPlantingDate: new Date().toISOString().substring(0, 10)
    });
  }

  protected submitPlantingForm() {
    if (this.plantingForm.invalid) return;

    const val = this.plantingForm.value;
    const payload: Omit<PlantingPlan, 'id'> = {
      fieldId: val.fieldId,
      cropYear: val.cropYear,
      crop: val.crop,
      variety: val.variety,
      targetPlantingDate: val.targetPlantingDate,
      targetHarvestDate: val.targetHarvestDate,
      status: 'planned'
    };

    // Simulate creation locally
    this.plantingPlans.update(list => [payload as PlantingPlan, ...list]);
    this.toastService.success(`New planting cycle scheduled for crop year ${val.cropYear}!`);
    this.closeAddPlantingModal();
  }

  protected openAddHarvestModal() {
    this.isHarvestModalOpen.set(true);
  }

  protected closeAddHarvestModal() {
    this.isHarvestModalOpen.set(false);
    this.harvestForm.reset({
      cropYear: new Date().getFullYear(),
      harvestDate: new Date().toISOString().substring(0, 10),
      yieldUnit: 'tons',
      qualityGrade: 'Select'
    });
  }

  protected submitHarvestForm() {
    if (this.harvestForm.invalid) return;

    const val = this.harvestForm.value;
    const payload: Omit<HarvestRecord, 'id'> = {
      fieldId: val.fieldId,
      harvestDate: val.harvestDate,
      cropYear: val.cropYear,
      crop: val.crop,
      variety: val.variety,
      totalYieldAmount: val.totalYieldAmount,
      yieldUnit: val.yieldUnit,
      qualityGrade: val.qualityGrade,
      operatorName: val.operatorName
    };

    // Simulate saving locally
    this.harvestRecords.update(list => [payload as HarvestRecord, ...list]);

    // Also simulate creating a corresponding YieldRecord to build up the baseline benchmarking graph!
    const fields = this.fieldStore.fields();
    const field = fields.find(f => f.id === val.fieldId);
    const acreage = field ? field.areaAcres : 100;
    
    // Average yield per acre = total yield / acres
    const yieldPerAcre = parseFloat((val.totalYieldAmount / acreage).toFixed(2));

    const yieldPayload: Omit<YieldRecord, 'id'> = {
      fieldId: val.fieldId,
      cropYear: val.cropYear,
      crop: val.crop,
      avgYieldPerAcre: yieldPerAcre,
      unit: val.yieldUnit === 'tons' ? 'tons' : 'lbs',
      historicalAverage: yieldPerAcre * 0.95 // simulate baseline
    };

    this.yieldRecords.update(list => [yieldPayload as YieldRecord, ...list]);

    this.toastService.success(`Harvest operation registered successfully! Bulk weight yield recorded.`);
    this.closeAddHarvestModal();
  }

  // --- Inline action shortcuts ---

  protected markAsPlanted(plan: FormattedPlantingPlan) {
    this.plantingPlans.update(list => {
      return list.map(p => {
        if (p.id === plan.id) {
          return {
            ...p,
            status: 'planted',
            actualPlantingDate: new Date().toISOString().substring(0, 10)
          };
        }
        return p;
      });
    });
    this.toastService.success(`Field block status upgraded to 'Planted'! Active tracking initialized.`);
  }

  protected openHarvestFromPlanting(plan: FormattedPlantingPlan) {
    this.openAddHarvestModal();
    // Pre-fill harvest sheet details from the planting schedule cycle to reduce operational friction
    this.harvestForm.patchValue({
      fieldId: plan.fieldId,
      cropYear: plan.cropYear,
      crop: plan.crop,
      variety: plan.variety
    });
  }
}
