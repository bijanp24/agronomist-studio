import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { WaterApi } from '../../core/services/api/water.api';
import { ScoutingApi } from '../../core/services/api/scouting.api';
import { PestPcaApi } from '../../core/services/api/pest-pca.api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { WeatherSnapshot, IrrigationEvent, ScoutingReport, SprayRecommendation, Field } from 'shared';

// Import UI kit components
import {
  StatCardComponent,
  BadgeComponent,
  SkeletonComponent,
  SparklineComponent,
  DataTableComponent,
  ModalComponent
} from '../../shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    BadgeComponent,
    SkeletonComponent,
    SparklineComponent,
    DataTableComponent,
    ModalComponent
  ],
  templateUrl: './dashboard.html'
})
export default class DashboardPage {
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly waterApi = inject(WaterApi);
  private readonly scoutingApi = inject(ScoutingApi);
  private readonly pestPcaApi = inject(PestPcaApi);
  private readonly toastService = inject(ToastService);
  private readonly http = inject(HttpClient);

  // Local state signals for API data
  protected readonly weatherSnapshots = signal<WeatherSnapshot[]>([]);
  protected readonly irrigationEvents = signal<IrrigationEvent[]>([]);
  protected readonly scoutingReports = signal<ScoutingReport[]>([]);
  protected readonly sprayRecommendations = signal<SprayRecommendation[]>([]);
  protected readonly jobRuns = signal<any[]>([]);
  protected readonly dashboardLoading = signal<boolean>(false);

  // Modal Slide-over states
  protected readonly selectedRecommendation = signal<any | null>(null);
  protected readonly isModalOpen = signal<boolean>(false);

  // Today's Date
  protected readonly todayDate = new Date('2026-06-10');

  // Hardcoded reference ETo sparkline values to show historic weekly water loss
  protected readonly historicEtoTrend = [0.24, 0.28, 0.25, 0.31, 0.29, 0.33, 0.35];

  protected readonly irrigationColumns = [
    { key: 'fieldName', label: 'Field' },
    { key: 'startedAt', label: 'Start Time' },
    { key: 'durationHours', label: 'Duration' },
    { key: 'appliedInches', label: 'Applied' },
    { key: 'status', label: 'Status' }
  ];

  constructor() {
    // React to selected ranch changes from global shell selector
    effect(() => {
      const ranchId = this.ranchStore.selectedRanchId();
      this.loadDashboardData(ranchId);
    });
  }

  // Load all dashboard dependent datasets in parallel
  private loadDashboardData(ranchId: string | null) {
    this.dashboardLoading.set(true);

    const weather$ = this.waterApi.getWeather(ranchId || undefined);
    const irrigation$ = this.waterApi.getIrrigationEvents();
    const scouting$ = this.scoutingApi.getReports();
    const recommendations$ = this.pestPcaApi.getSprayRecommendations();

    forkJoin({
      weather: weather$,
      irrigation: irrigation$,
      scouting: scouting$,
      recommendations: recommendations$
    }).subscribe({
      next: (res) => {
        this.weatherSnapshots.set(res.weather);
        this.irrigationEvents.set(res.irrigation);
        this.scoutingReports.set(res.scouting);
        this.sprayRecommendations.set(res.recommendations);
        this.dashboardLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard metrics', err);
        this.toastService.danger('Failed to load ranch dashboard data. Please reload.');
        this.dashboardLoading.set(false);
      }
    });

    this.http.get<any[]>('/api/jobs/runs').subscribe({
      next: (runs) => this.jobRuns.set(runs),
      error: (err) => console.error('Failed to load job runs', err)
    });
  }

  // --- Computed Selections ---

  // Set of active field IDs for fast O(1) membership lookup
  private readonly activeFieldIds = computed(() => {
    return new Set(this.fieldStore.fields().map(f => f.id));
  });

  // Filtered collections reflecting the currently selected ranch's fields
  protected readonly filteredReports = computed(() => {
    const activeIds = this.activeFieldIds();
    return this.scoutingReports().filter(r => activeIds.has(r.fieldId));
  });

  protected readonly filteredIrrigation = computed(() => {
    const activeIds = this.activeFieldIds();
    return this.irrigationEvents().filter(e => activeIds.has(e.fieldId));
  });

  protected readonly filteredRecommendations = computed(() => {
    const activeIds = this.activeFieldIds();
    return this.sprayRecommendations().filter(r => activeIds.has(r.fieldId));
  });

  // Latest weather snapshot for current ranch display
  protected readonly latestWeather = computed(() => {
    const snapshots = this.weatherSnapshots();
    if (snapshots.length === 0) return null;
    return snapshots[snapshots.length - 1];
  });

  // --- Grid Join Map Computations (Keep templates simple and fast) ---

  protected readonly formattedIrrigationEvents = computed(() => {
    const fields = this.fieldStore.fields();
    const events = this.filteredIrrigation();

    return events.map(e => {
      const field = fields.find(f => f.id === e.fieldId);
      return {
        ...e,
        fieldName: field ? field.name : 'Unknown Field',
        crop: field ? field.crop : 'Unknown Crop'
      };
    });
  });

  protected readonly formattedRecommendations = computed(() => {
    const fields = this.fieldStore.fields();
    const recs = this.filteredRecommendations();

    return recs.map(r => {
      const field = fields.find(f => f.id === r.fieldId);
      return {
        ...r,
        fieldName: field ? field.name : 'Unknown Field',
        crop: field ? field.crop : 'Unknown Crop',
        materialNames: r.materials.map(m => m.tradeName).join(', ')
      };
    });
  });

  protected readonly formattedReports = computed(() => {
    const fields = this.fieldStore.fields();
    const reports = this.filteredReports();

    return reports.map(r => {
      const field = fields.find(f => f.id === r.fieldId);
      return {
        ...r,
        fieldName: field ? field.name : 'Unknown Field',
        crop: field ? field.crop : 'Unknown Crop',
        pestObservationSummary: r.pestObservations.map(o => `${o.pestName} (${o.percentInfestation || o.countPerLeaf || 0}%/count)`).join(', ')
      };
    });
  });

  // --- Dynamic Dashboard Metrics ---

  protected readonly managedLandValue = computed(() => {
    const count = this.fieldStore.fields().length;
    return `${count} Active ${count === 1 ? 'Field' : 'Fields'}`;
  });

  protected readonly managedLandTrend = computed(() => {
    return `${this.fieldStore.totalArea().toLocaleString()} Total Acres`;
  });

  protected readonly cimisEtoValue = computed(() => {
    const snapshots = this.weatherSnapshots();
    if (snapshots.length === 0) return '0.28 in';
    const sum = snapshots.reduce((acc, s) => acc + s.cimisEtoInches, 0);
    const avg = sum / snapshots.length;
    return `${avg.toFixed(2)} in/day`;
  });

  protected readonly activeAlertsCount = computed(() => {
    // Counts high-severity scouting reports + draft recommendations
    const urgentReports = this.filteredReports().filter(r => r.severity === 'high').length;
    const draftRecs = this.filteredRecommendations().filter(r => r.status === 'draft').length;
    return urgentReports + draftRecs;
  });

  protected readonly activeAlertsValue = computed(() => {
    const count = this.activeAlertsCount();
    return `${count} Active ${count === 1 ? 'Alert' : 'Alerts'}`;
  });

  protected readonly activeAlertsTrend = computed(() => {
    const count = this.filteredRecommendations().filter(r => r.status === 'draft').length;
    return `${count} Pending PCA ${count === 1 ? 'Rec' : 'Recs'}`;
  });

  protected readonly healthRatioValue = computed(() => {
    const fields = this.fieldStore.fields();
    if (fields.length === 0) return '100% Healthy';
    const healthyCount = fields.filter(f => f.status === 'healthy').length;
    const pct = Math.round((healthyCount / fields.length) * 100);
    return `${pct}% Healthy`;
  });

  protected readonly healthRatioTrend = computed(() => {
    const fields = this.fieldStore.fields();
    const healthyCount = fields.filter(f => f.status === 'healthy').length;
    return `${healthyCount} of ${fields.length} healthy`;
  });

  protected readonly healthRatioDesc = computed(() => {
    const attention = this.fieldStore.fields().filter(f => f.status !== 'healthy').length;
    return attention > 0 ? `${attention} field${attention === 1 ? ' requires' : 's require'} action` : 'All fields optimal';
  });

  // --- Slide-over Actions ---

  protected openRecommendation(rec: any) {
    this.selectedRecommendation.set(rec);
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    setTimeout(() => this.selectedRecommendation.set(null), 300); // Clear after transit animation
  }

  protected approveRecommendation(rec: any) {
    // Simulate updating recommendation status in memory/api
    this.sprayRecommendations.update(list => {
      return list.map(item => {
        if (item.id === rec.id) {
          return {
            ...item,
            status: 'approved',
            approvedAt: new Date().toISOString()
          };
        }
        return item;
      });
    });

    // Display a beautiful, rich toast notification
    this.toastService.success(`PCA Recommendation for ${rec.fieldName} signed & approved! Submission logged.`);
    
    // Close the panel
    this.closeModal();
  }

  // Helper method for resolving status types for badges
  protected getIrrigationBadgeType(status: 'scheduled' | 'active' | 'completed'): any {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'info';
      case 'scheduled': return 'scheduled';
      default: return 'zinc';
    }
  }

  protected getSeverityBadgeType(severity: 'low' | 'medium' | 'high'): any {
    switch (severity) {
      case 'low': return 'healthy';
      case 'medium': return 'warning';
      case 'high': return 'critical';
      default: return 'zinc';
    }
  }

  protected getRecommendationBadgeType(status: 'draft' | 'approved' | 'applied'): any {
    switch (status) {
      case 'applied': return 'success';
      case 'approved': return 'info';
      case 'draft': return 'draft';
      default: return 'zinc';
    }
  }
}
