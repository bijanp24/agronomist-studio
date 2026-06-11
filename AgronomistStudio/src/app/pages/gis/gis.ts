import { Component, inject, signal, computed, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpatialStore } from '../../core/store/spatial.store';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { LatLon, ElevationGrid, CarryingCapacityInputs } from 'shared';
import maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-gis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gis.html'
})
export default class GisPage implements OnInit, AfterViewInit, OnDestroy {
  protected readonly spatialStore = inject(SpatialStore);
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  // Map variables
  private map: maplibregl.Map | null = null;
  protected readonly mapLoading = signal(true);
  protected readonly mapError = signal(false);

  // Selected Learning Block
  protected readonly selectedBlock = signal<'boundary-area' | 'terrain-flow' | 'carrying-capacity'>('boundary-area');

  // Input states for Boundary Area
  protected readonly boundaryUnit = signal<'acre' | 'hectare'>('acre');
  protected readonly demoBoundaryCoords: LatLon[] = [
    { lat: 36.7400, lon: -119.9200 },
    { lat: 36.7400, lon: -119.9100 },
    { lat: 36.7320, lon: -119.9100 },
    { lat: 36.7320, lon: -119.9200 },
    { lat: 36.7400, lon: -119.9200 } // Closed polygon
  ];

  // Input states for Terrain Flow
  protected readonly cellSizeMeters = signal<number>(50);
  protected readonly gridValues = signal<number[][]>([
    [78.5, 78.2, 77.8, 77.3, 76.9],
    [78.1, 77.7, 77.2, 76.8, 76.4],
    [77.6, 77.2, 76.7, 76.3, 75.9],
    [77.0, 76.5, 76.1, 75.7, 75.3],
    [76.3, 75.9, 75.4, 75.0, 74.6]
  ]);

  // Input states for Carrying Capacity
  protected readonly capacityMode = signal<'logistic' | 'predator-prey'>('logistic');
  
  // Logistic Sliders
  protected readonly logisticInitial = signal<number>(20);
  protected readonly logisticK = signal<number>(200);
  protected readonly logisticR = signal<number>(0.3);
  protected readonly logisticSteps = signal<number>(40);

  // Lotka-Volterra Sliders
  protected readonly preyInitial = signal<number>(40);
  protected readonly predatorInitial = signal<number>(10);
  protected readonly lvAlpha = signal<number>(0.1);
  protected readonly lvBeta = signal<number>(0.02);
  protected readonly lvDelta = signal<number>(0.01);
  protected readonly lvGamma = signal<number>(0.1);
  protected readonly lvSteps = signal<number>(60);

  ngOnInit() {
    // Clean up prior runs on mount
    this.spatialStore.resetResults();
    this.spatialStore.loadDemoField();
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

  // --- Maplibre GIS Mapping Engine Integration ---

  private initMapEngine() {
    this.mapLoading.set(true);
    try {
      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-119.9150, 36.7360], // Centered near our San Joaquin valley demo block
        zoom: 14,
        attributionControl: false
      });

      this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      this.map.on('load', () => {
        this.mapLoading.set(false);
        this.mapError.set(false);
        this.setupMapLayers();
        this.visualizeBoundaryLayer();
      });

      this.map.on('error', (e) => {
        console.warn('MapLibre load error', e);
        this.mapLoading.set(false);
        this.mapError.set(true);
      });
    } catch (err) {
      console.error('Failed to init map engine', err);
      this.mapLoading.set(false);
      this.mapError.set(true);
    }
  }

  private setupMapLayers() {
    if (!this.map) return;

    // Boundary layer sources
    this.map.addSource('demo-boundary', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'demo-boundary-fill',
      type: 'fill',
      source: 'demo-boundary',
      paint: {
        'fill-color': 'rgba(94, 132, 74, 0.25)', // ag-green-500
        'fill-outline-color': '#496939'
      }
    });

    this.map.addLayer({
      id: 'demo-boundary-line',
      type: 'line',
      source: 'demo-boundary',
      paint: {
        'line-color': '#496939',
        'line-width': 3
      }
    });

    // Markers layer source (for flow/pooling points)
    this.map.addSource('gis-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'gis-points-layer',
      type: 'circle',
      source: 'gis-points',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'case',
          ['get', 'isPoolingZone'], '#e11d48', // rose-600 (pooling)
          ['get', 'isRunoffZone'], '#f59e0b',  // amber-500 (runoff)
          '#3b82f6'                            // blue-500 (standard slope point)
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff'
      }
    });
  }

  // --- Map Layer Visualization Controllers ---

  private visualizeBoundaryLayer() {
    if (!this.map) return;
    const source = this.map.getSource('demo-boundary') as maplibregl.GeoJSONSource;
    if (!source) return;

    const ring = this.demoBoundaryCoords;
    const polygonGeoJson: any = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...ring.map(p => [p.lon, p.lat])]]
        },
        properties: {}
      }]
    };
    source.setData(polygonGeoJson);

    // Clear points layer
    const ptsSource = this.map.getSource('gis-points') as maplibregl.GeoJSONSource;
    if (ptsSource) {
      ptsSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  private visualizeTerrainPoints(points: any[]) {
    if (!this.map) return;
    const source = this.map.getSource('gis-points') as maplibregl.GeoJSONSource;
    if (!source) return;

    const pointsGeoJson: any = {
      type: 'FeatureCollection',
      features: points.map((p, idx) => ({
        type: 'Feature',
        id: idx,
        geometry: {
          type: 'Point',
          coordinates: [p.lon, p.lat]
        },
        properties: {
          row: p.row,
          col: p.col,
          elevationM: p.elevationM,
          slopePercent: p.slopePercent,
          flowBearing: p.flowBearing,
          isPoolingZone: p.isPoolingZone,
          isRunoffZone: p.isRunoffZone
        }
      }))
    };
    source.setData(pointsGeoJson);
  }

  // --- Learning Blocks Simulation Actions ---

  protected selectLearningBlock(block: 'boundary-area' | 'terrain-flow' | 'carrying-capacity') {
    this.selectedBlock.set(block);
    this.spatialStore.resetResults();

    if (block === 'boundary-area') {
      this.visualizeBoundaryLayer();
    } else if (block === 'terrain-flow') {
      this.visualizeBoundaryLayer();
    } else {
      // Carrying capacity does not plot geodetic layers
      if (this.map) {
        const boundarySource = this.map.getSource('demo-boundary') as maplibregl.GeoJSONSource;
        const ptsSource = this.map.getSource('gis-points') as maplibregl.GeoJSONSource;
        if (boundarySource) boundarySource.setData({ type: 'FeatureCollection', features: [] });
        if (ptsSource) ptsSource.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }

  protected triggerBoundaryArea() {
    this.spatialStore.calculateBoundaryArea({
      ring: this.demoBoundaryCoords.slice(0, -1), // standard Shoelace doesn't need closed duplicate vertex
      unit: this.boundaryUnit()
    });
  }

  protected triggerTerrainFlow() {
    this.spatialStore.calculateTerrainFlow({
      values: this.gridValues(),
      cellSizeMeters: this.cellSizeMeters(),
      originLat: 36.7400,
      originLon: -119.9200
    });

    // Once calculations are back, plot terrain points dynamically onto the map
    setTimeout(() => {
      const terrainRes = this.spatialStore.terrainResult();
      if (terrainRes && terrainRes.outputLayers) {
        const slopeLayer = terrainRes.outputLayers.find(l => l.id === 'output-terrain-slope');
        if (slopeLayer && slopeLayer.attributes['points']) {
          this.visualizeTerrainPoints(slopeLayer.attributes['points']);
        }
      }
    }, 1000);
  }

  protected triggerCarryingCapacity() {
    const isLogistic = this.capacityMode() === 'logistic';
    if (isLogistic) {
      this.spatialStore.calculateCarryingCapacity({
        mode: 'logistic',
        logistic: {
          initialPopulation: this.logisticInitial(),
          carryingCapacity: this.logisticK(),
          growthRate: this.logisticR(),
          steps: this.logisticSteps()
        }
      });
    } else {
      this.spatialStore.calculateCarryingCapacity({
        mode: 'predator-prey',
        lotkaVolterra: {
          preyPopulation: this.preyInitial(),
          predatorPopulation: this.predatorInitial(),
          alpha: this.lvAlpha(),
          beta: this.lvBeta(),
          delta: this.lvDelta(),
          gamma: this.lvGamma(),
          steps: this.lvSteps(),
          stepSize: 0.1
        }
      });
    }
  }

  protected updateElevationCell(r: number, c: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      const current = [...this.gridValues()];
      current[r] = [...current[r]];
      current[r][c] = value;
      this.gridValues.set(current);
    }
  }

  // --- SVG Chart Helpers for Carrying Capacity ---

  protected get carryingChartSeries(): any[] {
    const res = this.spatialStore.carryingResult();
    if (!res || !res.outputLayers || res.outputLayers.length === 0) return [];
    return res.outputLayers[0].attributes['series'] || [];
  }

  // Generate responsive SVG path coordinates for ecological simulation curves
  protected get svgPathPoints(): { prey: string; predator: string; timeScale: number[] } {
    const series = this.carryingChartSeries;
    if (series.length === 0) return { prey: '', predator: '', timeScale: [] };

    const width = 500;
    const height = 180;
    const padding = 20;

    const maxT = series[series.length - 1].t || 1;
    
    // Evaluate maximum population bound to scale SVG coordinates
    let maxPop = 100;
    if (this.capacityMode() === 'logistic') {
      maxPop = Math.max(...series.map(s => s.population)) * 1.1;
    } else {
      const maxPrey = Math.max(...series.map(s => s.prey));
      const maxPred = Math.max(...series.map(s => s.predator));
      maxPop = Math.max(maxPrey, maxPred) * 1.1;
    }
    if (maxPop === 0) maxPop = 100;

    const timeScale = Array.from({ length: 5 }, (_, i) => Math.round((maxT / 4) * i));

    if (this.capacityMode() === 'logistic') {
      const points = series.map(s => {
        const x = padding + (s.t / maxT) * (width - padding * 2);
        const y = height - padding - (s.population / maxPop) * (height - padding * 2);
        return `${x},${y}`;
      }).join(' ');
      return { prey: points, predator: '', timeScale };
    } else {
      const preyPoints = series.map(s => {
        const x = padding + (s.t / maxT) * (width - padding * 2);
        const y = height - padding - (s.prey / maxPop) * (height - padding * 2);
        return `${x},${y}`;
      }).join(' ');

      const predPoints = series.map(s => {
        const x = padding + (s.t / maxT) * (width - padding * 2);
        const y = height - padding - (s.predator / maxPop) * (height - padding * 2);
        return `${x},${y}`;
      }).join(' ');

      return { prey: preyPoints, predator: predPoints, timeScale };
    }
  }

  protected get maxPopulationValue(): number {
    const series = this.carryingChartSeries;
    if (series.length === 0) return 200;
    if (this.capacityMode() === 'logistic') {
      return Math.max(...series.map(s => s.population));
    } else {
      const maxPrey = Math.max(...series.map(s => s.prey));
      const maxPred = Math.max(...series.map(s => s.predator));
      return Math.max(maxPrey, maxPred);
    }
  }
}
