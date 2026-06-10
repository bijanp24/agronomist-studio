import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    <div class="flex flex-col gap-1 w-full h-full">
      <svg 
        [attr.viewBox]="viewBox()" 
        class="overflow-visible"
        [attr.width]="width()" 
        [attr.height]="height()"
      >
        <!-- Gradients -->
        <defs>
          <linearGradient [id]="gradientId()" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="strokeColor()" stop-opacity="0.2"/>
            <stop offset="100%" [attr.stop-color]="strokeColor()" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Area Fill -->
        @if (points().length > 1 && fill()) {
          <path 
            [attr.d]="areaPath()" 
            [attr.fill]="'url(#' + gradientId() + ')'"
          />
        }

        <!-- Line Path -->
        @if (points().length > 1) {
          <path 
            [attr.d]="linePath()" 
            fill="none" 
            [attr.stroke]="strokeColor()" 
            [attr.stroke-width]="strokeWidth()"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }

        <!-- Interactive hover points (latest) -->
        @if (points().length > 0 && showDot()) {
          <circle 
            [attr.cx]="latestPoint().x" 
            [attr.cy]="latestPoint().y" 
            [attr.r]="strokeWidth() * 1.5" 
            [attr.fill]="strokeColor()"
            class="transition-all duration-300"
          />
        }
      </svg>
    </div>
  `
})
export class SparklineComponent {
  data = input.required<number[]>();
  width = input<number>(120);
  height = input<number>(40);
  strokeColor = input<string>('#5e844a'); // Defaults to ag-green-500
  strokeWidth = input<number>(1.75);
  fill = input<boolean>(true);
  showDot = input<boolean>(true);

  private readonly padding = 3;

  // Generate a unique ID for SVG gradients
  protected readonly gradientId = computed(() => 'spark-grad-' + Math.random().toString(36).substring(2, 9));

  protected readonly viewBox = computed(() => `0 0 ${this.width()} ${this.height()}`);

  protected readonly points = computed(() => {
    const raw = this.data();
    const w = this.width();
    const h = this.height();
    const p = this.padding;

    if (raw.length === 0) return [];

    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const range = max - min || 1;

    return raw.map((val, idx) => {
      const x = p + (idx / (raw.length - 1 || 1)) * (w - 2 * p);
      const y = h - p - ((val - min) / range) * (h - 2 * p);
      return { x, y };
    });
  });

  protected readonly linePath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    return pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  });

  protected readonly areaPath = computed(() => {
    const pts = this.points();
    const h = this.height();
    if (pts.length === 0) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${this.linePath()} L ${last.x} ${h} L ${first.x} ${h} Z`;
  });

  protected readonly latestPoint = computed(() => {
    const pts = this.points();
    return pts[pts.length - 1] || { x: 0, y: 0 };
  });
}
