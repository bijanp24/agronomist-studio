import { Component, inject, signal, computed, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { RanchesFieldsApi } from '../../core/services/api/ranches-fields.api';
import { WaterApi } from '../../core/services/api/water.api';
import { ScoutingApi } from '../../core/services/api/scouting.api';
import { PestPcaApi } from '../../core/services/api/pest-pca.api';
import { NutrientsApi } from '../../core/services/api/nutrients.api';
import { CropPlanningApi } from '../../core/services/api/crop-planning.api';
import { AgronomyApi, AgronomyLocationSummary } from '../../core/services/api/agronomy.api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { Field, SoilSample, TissueSample, NitrogenPlan, IrrigationEvent, ScoutingReport } from 'shared';
import { BadgeComponent, DataTableComponent, ModalComponent, SkeletonComponent } from '../../shared';

import maplibregl from 'maplibre-gl';

export interface TimelineEvent {
  id: string;
  type: 'scouting' | 'irrigation' | 'laboratory' | 'treatment' | 'harvest';
  date: string;
  title: string;
  subtitle: string;
  description?: string;
  metadata?: Record<string, string | number>;
}

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BadgeComponent,
    DataTableComponent,
    ModalComponent,
    SkeletonComponent
  ],
  templateUrl: './fields.html'
})
export default class FieldsPage implements AfterViewInit, OnDestroy {
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly ranchesFieldsApi = inject(RanchesFieldsApi);
  private readonly waterApi = inject(WaterApi);
  private readonly scoutingApi = inject(ScoutingApi);
  private readonly pestPcaApi = inject(PestPcaApi);
  private readonly nutrientsApi = inject(NutrientsApi);
  private readonly cropPlanningApi = inject(CropPlanningApi);
  private readonly agronomyApi = inject(AgronomyApi);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // MapLibre instances & flags
  private map: maplibregl.Map | null = null;
  protected readonly mapLoading = signal<boolean>(true);
  protected readonly mapError = signal<boolean>(false);

  // Search & Filter UI signals
  protected readonly localSearchQuery = signal<string>('');
  protected readonly statusFilter = signal<'all' | 'healthy' | 'needs-attention' | 'critical'>('all');

  // Selected Field inspection signals
  protected readonly selectedField = signal<Field | null>(null);
  protected readonly selectedSoilSamples = signal<SoilSample[]>([]);
  protected readonly selectedTissueSamples = signal<TissueSample[]>([]);
  protected readonly selectedNitrogenPlan = signal<NitrogenPlan | null>(null);
  protected readonly selectedAgronomySummary = signal<AgronomyLocationSummary | null>(null);
  protected readonly agronomyLoading = signal<boolean>(false);
  protected readonly agronomyError = signal<string | null>(null);

  // Field Activity Timeline signals
  protected readonly timelineData = signal<TimelineEvent[]>([]);
  protected readonly timelineLoading = signal<boolean>(false);

  // Form group for adding a field
  protected fieldForm!: FormGroup;
  protected readonly isAddFieldModalOpen = signal<boolean>(false);

  // Standard static math reference
  protected readonly Math = Math;

  // Grid index columns definition
  protected readonly fieldColumns = [
    { key: 'name', label: 'Field Name', sortable: true },
    { key: 'crop', label: 'Crop / Cultivar', sortable: true },
    { key: 'areaAcres', label: 'Acreage', sortable: true },
    { key: 'status', label: 'Health Index', sortable: true },
    { key: 'lastScouted', label: 'Last Scouted', sortable: true }
  ];

  constructor() {
    this.initFieldForm();

    // Re-fit map bounds whenever fields load or selected ranch changes
    effect(() => {
      const fields = this.filteredFields();
      this.updateMapBoundaries(fields);
    });
  }

  ngAfterViewInit() {
    this.initMapEngine();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // --- Search & Filter pipeline ---

  protected readonly filteredFields = computed(() => {
    let list = this.fieldStore.fields();

    // Filter by local text input query
    const query = this.localSearchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.crop.toLowerCase().includes(query) || 
        (f.variety && f.variety.toLowerCase().includes(query))
      );
    }

    // Filter by health category state
    const status = this.statusFilter();
    if (status !== 'all') {
      list = list.filter(f => f.status === status);
    }

    return list;
  });

  protected onLocalSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.localSearchQuery.set(input.value);
  }

  protected onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value as any);
  }

  // --- API Detail & Unified timeline synthesis ---

  protected onFieldSelect(field: Field) {
    this.selectedField.set(field);
    this.timelineLoading.set(true);

    // Zoom Map to selected Field polygon
    let lat = 36.7783; // nominal central CA
    let lon = -119.4179;
    if (field.boundaryJson) {
      const coords = field.boundaryJson.coordinates[0];
      const bounds = coords.reduce((acc, coord) => {
        return acc.extend(coord as [number, number]);
      }, new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]));
      this.map?.fitBounds(bounds, { padding: 80, maxZoom: 16 });

      const midIdx = Math.floor(coords.length / 2);
      lon = coords[midIdx][0];
      lat = coords[midIdx][1];
    }

    // Fetch live agronomy gateway recommendations for coordinates
    this.agronomyLoading.set(true);
    this.agronomyError.set(null);
    this.selectedAgronomySummary.set(null);
    this.agronomyApi.getLocationSummary(lat, lon, undefined, field.crop).subscribe({
      next: (summary) => {
        this.selectedAgronomySummary.set(summary);
        this.agronomyLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load agronomy live summary', err);
        this.agronomyError.set('Failed to fetch live California data feeds.');
        this.agronomyLoading.set(false);
      }
    });

    // Parallel fetch all field operations records with safe fallback handlers
    const scouting$ = this.scoutingApi.getReports(field.id).pipe(catchError(() => of([] as ScoutingReport[])));
    const irrigation$ = this.waterApi.getIrrigationEvents(field.id).pipe(catchError(() => of([] as IrrigationEvent[])));
    const soil$ = this.nutrientsApi.getSoilSamples(field.id).pipe(catchError(() => of([] as SoilSample[])));
    const tissue$ = this.nutrientsApi.getTissueSamples(field.id).pipe(catchError(() => of([] as TissueSample[])));
    const nitrogen$ = this.nutrientsApi.getNitrogenPlans(field.id).pipe(catchError(() => of([] as NitrogenPlan[])));
    const cropPlans$ = this.cropPlanningApi.getPlantingPlans(field.id).pipe(catchError(() => of([])));
    const harvests$ = this.cropPlanningApi.getHarvestRecords(field.id).pipe(catchError(() => of([])));
    const recommendations$ = this.pestPcaApi.getSprayRecommendations(field.id).pipe(catchError(() => of([])));

    forkJoin({
      scouting: scouting$,
      irrigation: irrigation$,
      soil: soil$,
      tissue: tissue$,
      nitrogen: nitrogen$,
      cropPlans: cropPlans$,
      harvests: harvests$,
      recommendations: recommendations$
    }).subscribe({
      next: (res) => {
        // Set nutrient snapshots
        this.selectedSoilSamples.set(res.soil);
        this.selectedTissueSamples.set(res.tissue);
        this.selectedNitrogenPlan.set(res.nitrogen[0] || null);

        // Map various events into Timeline structure
        const events: TimelineEvent[] = [];

        // 1. Scouting Logs
        res.scouting.forEach(s => {
          events.push({
            id: s.id,
            type: 'scouting',
            date: s.scoutedAt,
            title: 'Crop Field Inspection',
            subtitle: `Scouted by ${s.scouterName} &bull; Stage: ${s.cropStage}`,
            description: s.notes,
            metadata: {
              Severity: s.severity.toUpperCase(),
              Observations: s.pestObservations.map(o => `${o.pestName}`).join(', ')
            }
          });
        });

        // 2. Irrigation Events
        res.irrigation.forEach(i => {
          events.push({
            id: i.id,
            type: 'irrigation',
            date: i.startedAt,
            title: `Irrigation Activity - ${i.status.toUpperCase()}`,
            subtitle: `${i.durationHours} Hours execution cycle`,
            metadata: {
              'Applied Water': `${i.appliedInches} inches equivalent`,
              'Total Volume': `${i.gallonsApplied.toLocaleString()} Gallons`
            }
          });
        });

        // 3. Lab Analyses (Soil & Tissue)
        res.soil.forEach(s => {
          events.push({
            id: s.id,
            type: 'laboratory',
            date: s.sampleDate + 'T08:00:00Z',
            title: 'Laboratory Soil Analysis',
            subtitle: `Lab Sample ID: ${s.labSampleNumber}`,
            metadata: {
              Nitrogen: `${s.nitrogenPpm} ppm`,
              Phosphorus: `${s.phosphorusPpm} ppm`,
              Potassium: `${s.potassiumPpm} ppm`,
              'Soil pH': s.ph
            }
          });
        });

        res.tissue.forEach(t => {
          events.push({
            id: t.id,
            type: 'laboratory',
            date: t.sampleDate + 'T08:00:00Z',
            title: 'Laboratory Tissue Analysis',
            subtitle: `Deficiency Diagnostic Index`,
            metadata: {
              Status: t.status.toUpperCase(),
              Nitrogen: `${t.nitrogenPct}%`,
              Potassium: `${t.potassiumPct}%`,
              Zinc: `${t.zincPpm} ppm`
            }
          });
        });

        // 4. Pesticide spray recommendations
        res.recommendations.forEach(r => {
          events.push({
            id: r.id,
            type: 'treatment',
            date: r.createdAt,
            title: `PCA Material spray Order (${r.status.toUpperCase()})`,
            subtitle: `Authorized Advisor: ${r.pcaName} (${r.pcaLicense})`,
            description: `Target pest control program configured for ${r.pestTarget}. Air/Ground method applied.`,
            metadata: {
              Material: r.materials.map(m => m.tradeName).join(', '),
              Rate: r.materials.map(m => m.ratePerAcre).join(', ')
            }
          });
        });

        // 5. Harvest records
        res.harvests.forEach(h => {
          events.push({
            id: h.id,
            type: 'harvest',
            date: h.harvestDate + 'T17:00:00Z',
            title: 'Yield Harvest Logged',
            subtitle: `Crop Year ${h.cropYear} &bull; Quality Grade: ${h.qualityGrade || 'N/A'}`,
            metadata: {
              'Harvest Tonnage': `${h.totalYieldAmount.toLocaleString()} ${h.yieldUnit}`,
              Operator: h.operatorName
            }
          });
        });

        // Sort events descending chronological order
        const sorted = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.timelineData.set(sorted);
        this.timelineLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load field operations logs', err);
        this.toastService.danger('Failed to load operations logs. Please retry.');
        this.timelineLoading.set(false);
      }
    });
  }

  protected deselectField() {
    this.selectedField.set(null);
    this.selectedSoilSamples.set([]);
    this.selectedTissueSamples.set([]);
    this.selectedNitrogenPlan.set(null);
    this.selectedAgronomySummary.set(null);
    this.agronomyError.set(null);
    this.timelineData.set([]);
    this.resetMapCamera();
  }

  // --- GIS Mapping Engine integration ---

  private initMapEngine() {
    this.mapLoading.set(true);

    try {
      // Initialize maplibre container with CartoDB Positron style (which requires NO external API keys)
      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-119.4179, 36.7783], // Central California center coordinates
        zoom: 6,
        attributionControl: false
      });

      this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      this.map.on('load', () => {
        this.mapLoading.set(false);
        this.mapError.set(false);
        
        // Setup empty GIS boundary layers
        this.setupMapLayers();
        this.updateMapBoundaries(this.filteredFields());
      });

      this.map.on('error', (e) => {
        console.warn('MapLibre style/network load error. Initializing local SVG fallback.', e);
        this.mapLoading.set(false);
        this.mapError.set(true);
      });

    } catch (err) {
      console.error('Failed to initialize WebGL map engine.', err);
      this.mapLoading.set(false);
      this.mapError.set(true);
    }
  }

  private setupMapLayers() {
    if (!this.map) return;

    // Register dynamic GeoJSON source
    this.map.addSource('field-boundaries', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Layer 1: Colored Polygon Fill representing Health indices
    this.map.addLayer({
      id: 'boundaries-fill',
      type: 'fill',
      source: 'field-boundaries',
      paint: {
        'fill-color': [
          'match',
          ['get', 'status'],
          'healthy', 'rgba(94, 132, 74, 0.45)',        // ag-green-500
          'needs-attention', 'rgba(217, 119, 6, 0.45)', // amber-600
          'critical', 'rgba(225, 29, 72, 0.45)',       // rose-600
          'rgba(161, 161, 170, 0.45)'                  // zinc-400 fallback
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.70,
          0.45
        ]
      }
    });

    // Layer 2: Colored borders
    this.map.addLayer({
      id: 'boundaries-stroke',
      type: 'line',
      source: 'field-boundaries',
      paint: {
        'line-color': [
          'match',
          ['get', 'status'],
          'healthy', '#496939',
          'needs-attention', '#d97706',
          'critical', '#e11d48',
          '#71717a'
        ],
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          3,
          1.75
        ]
      }
    });

    // Add interactivity events
    let hoveredStateId: string | number | null = null;
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

    this.map.on('mousemove', 'boundaries-fill', (e) => {
      if (!this.map || !e.features || e.features.length === 0) return;
      this.map.getCanvas().style.cursor = 'pointer';

      const feat = e.features[0];
      const props = feat.properties;

      // Update hover style state
      if (hoveredStateId !== null) {
        this.map.setFeatureState(
          { source: 'field-boundaries', id: hoveredStateId },
          { hover: false }
        );
      }
      hoveredStateId = feat.id || 0;
      this.map.setFeatureState(
        { source: 'field-boundaries', id: hoveredStateId },
        { hover: true }
      );

      // Render tooltip popup
      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-2 space-y-1 font-sans text-xs">
            <h4 class="font-extrabold text-zinc-900 leading-tight">${props['name']}</h4>
            <p class="text-zinc-500 font-medium">${props['crop']} &bull; ${props['areaAcres']} Acres</p>
            <span class="inline-block px-1.5 py-0.5 mt-1 font-bold rounded capitalize" style="
              background-color: ${props['status'] === 'healthy' ? '#f0fdf4' : (props['status'] === 'needs-attention' ? '#fffbeb' : '#fff1f2')};
              color: ${props['status'] === 'healthy' ? '#15803d' : (props['status'] === 'needs-attention' ? '#b45309' : '#be123c')};
              border: 1px solid ${props['status'] === 'healthy' ? '#bbf7d0' : (props['status'] === 'needs-attention' ? '#fde68a' : '#fecdd3')};
            ">${props['status']}</span>
          </div>
        `)
        .addTo(this.map);
    });

    this.map.on('mouseleave', 'boundaries-fill', () => {
      if (!this.map) return;
      this.map.getCanvas().style.cursor = '';
      
      if (hoveredStateId !== null) {
        this.map.setFeatureState(
          { source: 'field-boundaries', id: hoveredStateId },
          { hover: false }
        );
        hoveredStateId = null;
      }
      popup.remove();
    });

    this.map.on('click', 'boundaries-fill', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const fieldId = feat.properties ? feat.properties['id'] : null;
      if (fieldId) {
        const field = this.fieldStore.fields().find(f => f.id === fieldId);
        if (field) {
          popup.remove();
          this.onFieldSelect(field);
        }
      }
    });
  }

  private updateMapBoundaries(fields: Field[]) {
    if (!this.map || this.mapError()) return;

    const source = this.map.getSource('field-boundaries') as maplibregl.GeoJSONSource;
    if (!source) return;

    // Convert fields into GeoJSON format
    const features = fields
      .filter(f => f.boundaryJson)
      .map((f, idx) => ({
        type: 'Feature',
        id: idx + 1, // Feature state hover requires numeric ID
        properties: {
          id: f.id,
          name: f.name,
          crop: f.crop,
          variety: f.variety,
          areaAcres: f.areaAcres,
          status: f.status
        },
        geometry: f.boundaryJson
      }));

    source.setData({
      type: 'FeatureCollection',
      features: features as any
    });

    // Zoom and recenter camera to contain all polygon boundaries
    if (features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      features.forEach(f => {
        const coords = f.geometry!.coordinates[0];
        coords.forEach(coord => {
          bounds.extend(coord as [number, number]);
        });
      });
      this.map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
    } else {
      // Zoom out to global CA coordinates if empty
      this.map.setCenter([-119.4179, 36.7783]);
      this.map.setZoom(6);
    }
  }

  protected resetMapCamera() {
    this.updateMapBoundaries(this.filteredFields());
  }

  // --- Add New Field Form Registry ---

  private initFieldForm() {
    this.fieldForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      crop: ['Almonds', [Validators.required]],
      variety: ['', [Validators.required, Validators.minLength(2)]],
      areaAcres: [80, [Validators.required, Validators.min(1), Validators.max(1000)]],
      county: ['Fresno', [Validators.required]]
    });
  }

  protected openAddFieldModal() {
    this.isAddFieldModalOpen.set(true);
  }

  protected closeAddFieldModal() {
    this.isAddFieldModalOpen.set(false);
    this.fieldForm.reset({
      crop: 'Almonds',
      areaAcres: 80,
      county: 'Fresno'
    });
  }

  protected submitFieldForm() {
    if (this.fieldForm.invalid) return;

    const formVal = this.fieldForm.value;
    const ranchId = this.ranchStore.selectedRanchId() || 'r1'; // Fallback to sierra ranch

    // Centroid points & boundaries mapping default polygons depending on county selection
    let defaultBoundaryJson: any = null;

    if (formVal.county === 'Fresno') {
      defaultBoundaryJson = {
        type: 'Polygon',
        coordinates: [
          [
            [-119.700, 36.805],
            [-119.685, 36.805],
            [-119.685, 36.798],
            [-119.700, 36.798],
            [-119.700, 36.805]
          ]
        ]
      };
    } else if (formVal.county === 'Kern') {
      defaultBoundaryJson = {
        type: 'Polygon',
        coordinates: [
          [
            [-119.080, 35.415],
            [-119.060, 35.415],
            [-119.060, 35.405],
            [-119.080, 35.405],
            [-119.080, 35.415]
          ]
        ]
      };
    } else { // Yolo county
      defaultBoundaryJson = {
        type: 'Polygon',
        coordinates: [
          [
            [-121.880, 38.705],
            [-121.865, 38.705],
            [-121.865, 38.695],
            [-121.880, 38.695],
            [-121.880, 38.705]
          ]
        ]
      };
    }

    const payload: Omit<Field, 'id' | 'createdAt'> = {
      ranchId,
      name: formVal.name,
      crop: formVal.crop,
      variety: formVal.variety,
      areaAcres: formVal.areaAcres,
      county: formVal.county,
      status: 'healthy',
      boundaryJson: defaultBoundaryJson
    };

    this.ranchesFieldsApi.createField(payload).subscribe({
      next: (createdField) => {
        this.toastService.success(`Field boundary registered successfully! coordinates indexed for ${createdField.name}`);
        this.closeAddFieldModal();
        
        // Trigger global signal stores refresh
        this.fieldStore.loadFields(ranchId);
      },
      error: (err) => {
        console.error('Failed to create field registry entry', err);
        this.toastService.danger('Failed to register crop. Please check parameters.');
      }
    });
  }
}
