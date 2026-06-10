import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { ScoutingApi } from '../../core/services/api/scouting.api';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { ScoutingReport, PestObservationSummary, Field } from 'shared';

// Import shared UI Kit
import { StatCardComponent, BadgeComponent, SkeletonComponent, ModalComponent } from '../../shared';

export interface FormattedScoutingReport extends ScoutingReport {
  fieldName: string;
  crop: string;
}

@Component({
  selector: 'app-scouting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatCardComponent,
    BadgeComponent,
    SkeletonComponent,
    ModalComponent
  ],
  templateUrl: './scouting.html'
})
export default class ScoutingPage implements OnInit {
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly scoutingApi = inject(ScoutingApi);
  private readonly ranchesFieldsApi = inject(RanchesFieldsApi);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // Directory loading/data states
  protected readonly rawReports = signal<ScoutingReport[]>([]);
  protected readonly loading = signal<boolean>(false);

  // Search & Filters state
  protected readonly searchQuery = signal<string>('');
  protected readonly severityFilter = signal<'all' | 'low' | 'medium' | 'high'>('all');
  protected readonly cropFilter = signal<string>('all');

  // Detail inspection state
  protected readonly selectedReportId = signal<string | null>(null);

  // Log Form states
  protected scoutForm!: FormGroup;
  protected readonly isModalOpen = signal<boolean>(false);
  protected readonly pestObservations = signal<PestObservationSummary[]>([]);

  constructor() {
    this.initScoutForm();

    // Re-load listings when global selected ranch changes
    effect(() => {
      const ranchId = this.ranchStore.selectedRanchId();
      this.loadScoutingFeed(ranchId);
    });
  }

  ngOnInit() {
    const ranchId = this.ranchStore.selectedRanchId();
    this.loadScoutingFeed(ranchId);
  }

  private loadScoutingFeed(ranchId: string | null) {
    this.loading.set(true);
    
    // Always fetch all reports (filtering is handled dynamically on client based on current active ranch fields)
    this.scoutingApi.getReports().subscribe({
      next: (reports) => {
        this.rawReports.set(reports);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load scouting records', err);
        this.toastService.danger('Failed to load scouting logs. Please reload.');
        this.loading.set(false);
      }
    });
  }

  // --- Dynamic Search & Filter computations ---

  private readonly activeFieldIds = computed(() => {
    return new Set(this.fieldStore.fields().map(f => f.id));
  });

  protected readonly formattedReports = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    // Map fields info (Name & Crop) into report lists
    return this.rawReports()
      .filter(r => activeIds.has(r.fieldId))
      .map(r => {
        const field = fields.find(f => f.id === r.fieldId);
        return {
          ...r,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop'
        } as FormattedScoutingReport;
      });
  });

  protected readonly filteredReports = computed(() => {
    let list = this.formattedReports();

    // Filter by text search query
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(r => 
        r.scouterName.toLowerCase().includes(query) || 
        r.fieldName.toLowerCase().includes(query) || 
        r.notes.toLowerCase().includes(query)
      );
    }

    // Filter by Severity
    const severity = this.severityFilter();
    if (severity !== 'all') {
      list = list.filter(r => r.severity === severity);
    }

    // Filter by Crop type
    const crop = this.cropFilter();
    if (crop !== 'all') {
      list = list.filter(r => r.crop === crop);
    }

    return list;
  });

  protected readonly detailedReport = computed(() => {
    const id = this.selectedReportId();
    if (!id) return null;
    return this.filteredReports().find(r => r.id === id) || null;
  });

  // --- Search & Filter handlers ---

  protected onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onSeverityFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.severityFilter.set(select.value as any);
  }

  protected onCropFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.cropFilter.set(select.value);
  }

  protected selectReport(report: FormattedScoutingReport) {
    this.selectedReportId.set(report.id);
  }

  // --- Stats Dashboard Computations ---

  protected readonly totalInspectionsValue = computed(() => {
    const count = this.formattedReports().length;
    return `${count} Record${count === 1 ? '' : 's'} Logged`;
  });

  protected readonly activeFieldsCoverageTrend = computed(() => {
    const coveredFields = new Set(this.formattedReports().map(r => r.fieldId)).size;
    const totalFields = this.fieldStore.fields().length;
    return `${coveredFields} of ${totalFields} Fields Inspected`;
  });

  protected readonly severeOutbreaksCount = computed(() => {
    return this.formattedReports().filter(r => r.severity === 'high').length;
  });

  protected readonly severeOutbreaksValue = computed(() => {
    const count = this.severeOutbreaksCount();
    return `${count} High Alert${count === 1 ? '' : 's'}`;
  });

  protected readonly dominantPestValue = computed(() => {
    const reports = this.formattedReports();
    if (reports.length === 0) return 'None';

    const pestCounts: Record<string, number> = {};
    reports.forEach(r => {
      r.pestObservations.forEach(o => {
        pestCounts[o.pestName] = (pestCounts[o.pestName] || 0) + 1;
      });
    });

    let topPest = 'None';
    let max = 0;
    Object.entries(pestCounts).forEach(([name, count]) => {
      if (count > max) {
        max = count;
        topPest = name;
      }
    });

    return topPest;
  });

  protected readonly dominantPestTrend = computed(() => {
    const name = this.dominantPestValue();
    if (name === 'None') return '0 active observations';
    
    // Calculate how many fields have this pest
    const activeIds = new Set(
      this.formattedReports()
        .filter(r => r.pestObservations.some(o => o.pestName === name))
        .map(r => r.fieldId)
    );
    const count = activeIds.size;
    return `Active on ${count} field${count === 1 ? '' : 's'}`;
  });

  protected readonly activeAdvisorsValue = computed(() => {
    const scouters = new Set(this.formattedReports().map(r => r.scouterName));
    return `${scouters.size} Field Advisor${scouters.size === 1 ? '' : 's'}`;
  });

  // --- Dynamic New Report Form Form ---

  private initScoutForm() {
    this.scoutForm = this.fb.group({
      fieldId: ['', [Validators.required]],
      scouterName: ['', [Validators.required, Validators.minLength(3)]],
      severity: ['low', [Validators.required]],
      cropStage: ['Bloom', [Validators.required]],
      notes: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  protected openAddReportModal() {
    this.isModalOpen.set(true);
  }

  protected closeAddReportModal() {
    this.isModalOpen.set(false);
    this.scoutForm.reset({
      severity: 'low',
      cropStage: 'Bloom'
    });
    this.pestObservations.set([]);
  }

  protected onFieldChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const fieldId = select.value;
    const field = this.fieldStore.fields().find(f => f.id === fieldId);
    
    if (field) {
      // Suggest stage depending on active field crop selection
      let defaultStage = 'Bloom';
      if (field.crop === 'Processing Tomatoes') {
        defaultStage = 'Flowering & Fruit Set';
      } else if (field.crop === 'Pistachios') {
        defaultStage = 'Shell Hardening';
      } else if (field.crop === 'Wine Grapes') {
        defaultStage = 'Fruit Development';
      }
      this.scoutForm.patchValue({ cropStage: defaultStage });
    }
  }

  protected addPestObservation(pestName: string) {
    if (!pestName) return;

    // Check if species already logged
    const current = this.pestObservations();
    if (current.some(o => o.pestName === pestName)) {
      this.toastService.warning(`${pestName} is already added. Edit its density value directly.`);
      return;
    }

    const newObs: PestObservationSummary = {
      pestName,
      countPerLeaf: pestName === 'Early Blight' || pestName === 'Peach Twig Borer' ? undefined : 0,
      percentInfestation: pestName === 'Early Blight' || pestName === 'Peach Twig Borer' ? 0 : undefined
    };

    this.pestObservations.update(o => [...o, newObs]);
  }

  protected updatePestValue(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value) || 0;

    this.pestObservations.update(list => {
      return list.map((item, idx) => {
        if (idx === index) {
          if (item.percentInfestation !== undefined) {
            return { ...item, percentInfestation: val };
          } else {
            return { ...item, countPerLeaf: val };
          }
        }
        return item;
      });
    });
  }

  protected removePestObservation(index: number) {
    this.pestObservations.update(list => list.filter((_, idx) => idx !== index));
  }

  protected submitScoutForm() {
    if (this.scoutForm.invalid) return;

    const formVal = this.scoutForm.value;
    const field = this.fieldStore.fields().find(f => f.id === formVal.fieldId);
    if (!field) return;

    // Generate GPS Pin from selected field center coordinates
    let locationPin: any = undefined;
    if (field.boundaryJson) {
      const coords = field.boundaryJson.coordinates[0];
      const midIdx = Math.floor(coords.length / 2);
      locationPin = {
        type: 'Point',
        coordinates: coords[midIdx]
      };
    }

    const payload: Omit<ScoutingReport, 'id' | 'scoutedAt'> = {
      fieldId: formVal.fieldId,
      scouterName: formVal.scouterName,
      severity: formVal.severity,
      cropStage: formVal.cropStage,
      notes: formVal.notes,
      pestObservations: this.pestObservations(),
      locationPin
    };

    this.scoutingApi.createReport(payload).subscribe({
      next: () => {
        this.toastService.success(`Scouting Report registered successfully! Alert states recalculated.`);
        this.closeAddReportModal();
        
        // Refresh local cache listing
        const ranchId = this.ranchStore.selectedRanchId();
        this.loadScoutingFeed(ranchId);
      },
      error: (err) => {
        console.error('Failed to log scouting report', err);
        this.toastService.danger('Failed to submit scouting diagnostic. Please check parameters.');
      }
    });
  }

  // --- Badge Styling Utilities ---

  protected getSeverityBadgeType(severity: 'low' | 'medium' | 'high'): any {
    switch (severity) {
      case 'low': return 'healthy';
      case 'medium': return 'warning';
      case 'high': return 'critical';
      default: return 'zinc';
    }
  }
}
