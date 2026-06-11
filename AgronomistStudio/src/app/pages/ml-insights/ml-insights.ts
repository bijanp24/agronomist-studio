import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlStore } from '../../core/store/ml.store';
import { FieldStore } from '../../core/store/field.store';
import { RanchStore } from '../../core/store/ranch.store';
import { Field, YieldPrediction, OptimizationResult, RiskAssessment, BenchmarkResult } from 'shared';

@Component({
  selector: 'app-ml-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ml-insights.html'
})
export default class MlInsightsPage implements OnInit {
  protected readonly mlStore = inject(MlStore);
  protected readonly fieldStore = inject(FieldStore);
  protected readonly ranchStore = inject(RanchStore);

  // Field selection state
  protected readonly selectedFieldId = signal<string>('');

  // Interactive slider controls for inputs optimizer
  protected readonly currentIrrigation = signal<number>(40.0);
  protected readonly currentNitrogen = signal<number>(180.0);

  // Selected sub-tab
  protected readonly activeTab = signal<'yield' | 'optimizer' | 'benchmarking' | 'risk'>('yield');

  // Trigger loading details whenever selected field changes
  constructor() {
    effect(() => {
      const fieldId = this.selectedFieldId();
      if (fieldId) {
        this.mlStore.resetMlResults();
        
        // Find corresponding field to fetch its current crop
        const field = this.fieldStore.fields().find(f => f.id === fieldId);
        const cropName = field?.crop || 'Almond';

        // Load predictions, history, benchmarks, risks in parallel
        this.mlStore.predictYield({ fieldId, cropName });
        this.mlStore.loadYieldHistory({ fieldId, cropName });
        this.mlStore.compareBenchmark(fieldId);
        this.mlStore.assessRisk(fieldId);

        // Pre-fill optimizer sliders based on some mock rules
        const hash = this.hashCode(fieldId);
        this.currentIrrigation.set(38 + (hash % 10));
        this.currentNitrogen.set(160 + (hash % 40));
      }
    });

    // Auto-select first available field when list loads
    effect(() => {
      const fields = this.fieldStore.fields();
      if (fields.length > 0 && !this.selectedFieldId()) {
        this.selectedFieldId.set(fields[0].id);
      }
    });
  }

  ngOnInit() {
    this.mlStore.loadHealth();
    this.mlStore.loadClusters();
  }

  protected get selectedField(): Field | undefined {
    return this.fieldStore.fields().find(f => f.id === this.selectedFieldId());
  }

  protected triggerOptimization() {
    const fieldId = this.selectedFieldId();
    if (fieldId) {
      this.mlStore.optimizeInputs({
        fieldId,
        irrigationIn: this.currentIrrigation(),
        nitrogenLbAc: this.currentNitrogen()
      });
    }
  }

  protected triggerTrain(mtype: 'yield' | 'risk' | 'cluster') {
    this.mlStore.trainModel(mtype);
  }

  // --- SVG Layout Coordinate Scales for History Charts ---

  protected get historyChartPoints(): string {
    const historyData = this.mlStore.history()?.history || [];
    if (historyData.length === 0) return '';

    const width = 450;
    const height = 120;
    const padding = 20;

    const yields = historyData.map(h => h.yield_kg_ha);
    const maxY = Math.max(...yields, 5000) * 1.1;

    return historyData.map((h, i) => {
      const x = padding + (i / (historyData.length - 1)) * (width - padding * 2);
      const y = height - padding - (h.yield_kg_ha / maxY) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  }

  protected get historyYears(): number[] {
    const historyData = this.mlStore.history()?.history || [];
    return historyData.map(h => h.crop_year);
  }

  private hashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }
}
