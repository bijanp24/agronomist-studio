import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { WaterApi } from '../../core/services/api/water.api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { WeatherSnapshot, IrrigationEvent, SoilMoistureReading, Field } from 'shared';

// Import UI Kit
import { StatCardComponent, BadgeComponent, SkeletonComponent, SparklineComponent, DataTableComponent, ModalComponent } from '../../shared';

export interface FormattedIrrigationEvent extends IrrigationEvent {
  fieldName: string;
  crop: string;
}

@Component({
  selector: 'app-water',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatCardComponent,
    BadgeComponent,
    SkeletonComponent,
    SparklineComponent,
    DataTableComponent,
    ModalComponent
  ],
  templateUrl: './water.html'
})
export default class WaterPage implements OnInit {
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly waterApi = inject(WaterApi);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // Loading/cache states
  protected readonly weatherSnapshots = signal<WeatherSnapshot[]>([]);
  protected readonly rawIrrigationEvents = signal<IrrigationEvent[]>([]);
  protected readonly soilMoistureReadings = signal<SoilMoistureReading[]>([]);
  protected readonly loading = signal<boolean>(false);

  // Interactive sensor states
  protected readonly selectedMoistureFieldId = signal<string>('');

  // Table filtering state
  protected readonly statusFilter = signal<'all' | 'completed' | 'active' | 'scheduled'>('all');

  // Modal schedule form state
  protected waterForm!: FormGroup;
  protected readonly isModalOpen = signal<boolean>(false);

  // Historic 7-day CIMIS Reference solar curves
  protected readonly historicEtoTrend = [0.24, 0.28, 0.25, 0.31, 0.29, 0.33, 0.35];

  // Grid headers columns definition
  protected readonly gridColumns = [
    { key: 'fieldName', label: 'Field block', sortable: true },
    { key: 'startedAt', label: 'Started / Scheduled', sortable: true },
    { key: 'durationHours', label: 'Duration Time', sortable: true },
    { key: 'appliedInches', label: 'Applied Depth', sortable: true },
    { key: 'status', label: 'Run Status', sortable: true }
  ];

  constructor() {
    this.initWaterForm();

    // Re-fit data maps when global Selected ranch changes
    effect(() => {
      const ranchId = this.ranchStore.selectedRanchId();
      this.loadWaterTelemetry(ranchId);
    });
  }

  ngOnInit() {
    const ranchId = this.ranchStore.selectedRanchId();
    this.loadWaterTelemetry(ranchId);
  }

  private loadWaterTelemetry(ranchId: string | null) {
    this.loading.set(true);

    const weather$ = this.waterApi.getWeather(ranchId || undefined);
    const irrigation$ = this.waterApi.getIrrigationEvents();
    const moisture$ = this.waterApi.getSoilMoisture();

    forkJoin({
      weather: weather$,
      irrigation: irrigation$,
      moisture: moisture$
    }).subscribe({
      next: (res) => {
        this.weatherSnapshots.set(res.weather);
        this.rawIrrigationEvents.set(res.irrigation);
        this.soilMoistureReadings.set(res.moisture);

        // Pre-select first field for moisture probe profile
        const fields = this.fieldStore.fields();
        if (fields.length > 0 && !this.selectedMoistureFieldId()) {
          this.selectedMoistureFieldId.set(fields[0].id);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load water operations logs', err);
        this.toastService.danger('Failed to sync water sensors. Please reload page.');
        this.loading.set(false);
      }
    });
  }

  // --- Dynamic calculations computations ---

  private readonly activeFieldIds = computed(() => {
    return new Set(this.fieldStore.fields().map(f => f.id));
  });

  protected readonly formattedEvents = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.rawIrrigationEvents()
      .filter(e => activeIds.has(e.fieldId))
      .map(e => {
        const field = fields.find(f => f.id === e.fieldId);
        return {
          ...e,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop'
        } as FormattedIrrigationEvent;
      });
  });

  protected readonly filteredEvents = computed(() => {
    let list = this.formattedEvents();
    const status = this.statusFilter();
    
    if (status !== 'all') {
      list = list.filter(e => e.status === status);
    }

    // Sort: active first, then scheduled, then completed (descending start times)
    return list.sort((a, b) => {
      const statusWeight = { active: 3, scheduled: 2, completed: 1 };
      const weightA = statusWeight[a.status] || 0;
      const weightB = statusWeight[b.status] || 0;

      if (weightA !== weightB) return weightB - weightA;
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });
  });

  protected readonly activeMoistureReading = computed(() => {
    const fieldId = this.selectedMoistureFieldId();
    if (!fieldId) return null;
    return this.soilMoistureReadings().find(r => r.fieldId === fieldId) || null;
  });

  // --- Stats Summary computations ---

  protected readonly totalWaterAppliedValue = computed(() => {
    const completed = this.formattedEvents().filter(e => e.status === 'completed');
    const totalGal = completed.reduce((acc, e) => acc + e.gallonsApplied, 0);
    
    if (totalGal >= 1000000) {
      return `${(totalGal / 1000000).toFixed(2)} M Gal`;
    }
    return `${(totalGal / 1000).toFixed(1)} K Gal`;
  });

  protected readonly totalWaterAppliedTrend = computed(() => {
    const completed = this.formattedEvents().filter(e => e.status === 'completed');
    const totalInches = completed.reduce((acc, e) => acc + e.appliedInches, 0);
    return `${totalInches.toFixed(2)} inches cumulative applied`;
  });

  protected readonly dailyEtoAverageValue = computed(() => {
    const snapshots = this.weatherSnapshots();
    if (snapshots.length === 0) return '0.28 in';
    const sum = snapshots.reduce((acc, s) => acc + s.cimisEtoInches, 0);
    const avg = sum / snapshots.length;
    return `${avg.toFixed(2)} in/day`;
  });

  protected readonly soilMoistureAverage = computed(() => {
    const activeIds = this.activeFieldIds();
    const readings = this.soilMoistureReadings().filter(r => activeIds.has(r.fieldId));
    if (readings.length === 0) return 25.4; // standard nominal fallback

    const sum = readings.reduce((acc, r) => acc + r.averagePct, 0);
    return Math.round((sum / readings.length) * 10) / 10;
  });

  protected readonly soilMoistureAverageValue = computed(() => {
    return `${this.soilMoistureAverage()}% Vol`;
  });

  protected readonly soilMoistureTrend = computed(() => {
    const avg = this.soilMoistureAverage();
    if (avg < 20) return 'Critical low moisture deficit';
    if (avg < 24) return 'Approaching depletion threshold';
    return 'Optimal root zone saturation';
  });

  protected readonly activeIrrigationsCount = computed(() => {
    return this.formattedEvents().filter(e => e.status === 'active' || e.status === 'scheduled').length;
  });

  protected readonly activeIrrigationsValue = computed(() => {
    const count = this.activeIrrigationsCount();
    return `${count} Queue Run${count === 1 ? '' : 's'}`;
  });

  protected readonly scheduledVolumeTrend = computed(() => {
    const scheduled = this.formattedEvents().filter(e => e.status === 'scheduled');
    const sumGal = scheduled.reduce((acc, e) => acc + e.gallonsApplied, 0);
    return `${(sumGal / 1000).toFixed(0)} K Gallons queued`;
  });

  // --- Selector and status handlers ---

  protected onMoistureFieldChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedMoistureFieldId.set(select.value);
  }

  protected onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value as any);
  }

  protected toggleIrrigationStatus(event: any) {
    const newStatus: IrrigationEvent['status'] = event.status === 'active' ? 'completed' : 'active';
    
    this.waterApi.updateIrrigationEvent(event.id, { status: newStatus }).subscribe({
      next: () => {
        this.toastService.success(`Irrigation flow state updated on ${event.fieldName || 'Field'}. Sensors refreshed.`);
        const ranchId = this.ranchStore.selectedRanchId();
        this.loadWaterTelemetry(ranchId);
      },
      error: () => {
        this.toastService.danger('Failed to toggle valve actuator. Retry operation.');
      }
    });
  }

  // --- Schedule Form Logic ---

  private initWaterForm() {
    const nowStr = new Date(this.todayDatePlusOneDay()).toISOString().substring(0, 16);

    this.waterForm = this.fb.group({
      fieldId: ['', [Validators.required]],
      appliedInches: [0.45, [Validators.required, Validators.min(0.05), Validators.max(2.0)]],
      durationHours: [12, [Validators.required, Validators.min(1), Validators.max(48)]],
      startedAt: [nowStr, [Validators.required]]
    });
  }

  private todayDatePlusOneDay(): number {
    return new Date('2026-06-10T08:00:00Z').getTime() + 24 * 3600 * 1000;
  }

  protected openScheduleModal() {
    this.isModalOpen.set(true);
  }

  protected closeScheduleModal() {
    this.isModalOpen.set(false);
    this.waterForm.reset({
      appliedInches: 0.45,
      durationHours: 12,
      startedAt: new Date(this.todayDatePlusOneDay()).toISOString().substring(0, 16)
    });
  }

  protected onFieldChange(event: Event) {
    // No-op for now but triggers change re-evaluation for calculated gallons
  }

  // Computes the volume of gallons based on Selected field size & Applied inches input
  protected readonly calculatedGallons = computed(() => {
    const formVal = this.waterForm?.value;
    if (!formVal) return 0;

    const fieldId = formVal.fieldId;
    const inches = parseFloat(formVal.appliedInches) || 0;

    const field = this.fieldStore.fields().find(f => f.id === fieldId);
    if (!field) return 0;

    // Agronomic Constant: 1 Acre-Inch equivalent water applied = 27,154 Gallons
    return Math.round(inches * field.areaAcres * 27154);
  });

  protected submitScheduleForm() {
    if (this.waterForm.invalid) return;

    const formVal = this.waterForm.value;
    const field = this.fieldStore.fields().find(f => f.id === formVal.fieldId);
    if (!field) return;

    const startDate = new Date(formVal.startedAt);
    const durationMs = formVal.durationHours * 3600 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);

    const payload: Omit<IrrigationEvent, 'id' | 'status'> = {
      fieldId: formVal.fieldId,
      startedAt: startDate.toISOString(),
      endedAt: endDate.toISOString(),
      durationHours: formVal.durationHours,
      appliedInches: formVal.appliedInches,
      gallonsApplied: this.calculatedGallons()
    };

    this.waterApi.createIrrigationEvent(payload).subscribe({
      next: () => {
        this.toastService.success(`New irrigation cycle scheduled for ${field.name}! Water ledger logged.`);
        this.closeScheduleModal();
        
        // Refresh local cache list
        const ranchId = this.ranchStore.selectedRanchId();
        this.loadWaterTelemetry(ranchId);
      },
      error: (err) => {
        console.error('Failed to create water event', err);
        this.toastService.danger('Failed to schedule watering cycle. Please check input parameters.');
      }
    });
  }

  // --- Badge styling helper utilities ---

  protected getIrrigationBadgeType(status: 'scheduled' | 'active' | 'completed'): any {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'info';
      case 'scheduled': return 'scheduled';
      default: return 'zinc';
    }
  }
}
