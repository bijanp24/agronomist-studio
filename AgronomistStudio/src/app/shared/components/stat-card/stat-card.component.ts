import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 flex items-start justify-between">
      <div class="space-y-2">
        <span class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{{ label() }}</span>
        <div class="flex items-baseline gap-2">
          <h3 class="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{{ value() }}</h3>
          @if (trend()) {
            <span 
              class="text-xs font-medium px-1.5 py-0.5 rounded"
              [class.bg-emerald-50]="trendType() === 'up'"
              [class.text-emerald-700]="trendType() === 'up'"
              [class.dark:bg-emerald-950/20]="trendType() === 'up'"
              [class.dark:text-emerald-400]="trendType() === 'up'"
              [class.bg-rose-50]="trendType() === 'down'"
              [class.text-rose-700]="trendType() === 'down'"
              [class.dark:bg-rose-950/20]="trendType() === 'down'"
              [class.dark:text-rose-400]="trendType() === 'down'"
              [class.bg-zinc-100]="trendType() === 'neutral'"
              [class.text-zinc-600]="trendType() === 'neutral'"
              [class.dark:bg-zinc-800]="trendType() === 'neutral'"
              [class.dark:text-zinc-300]="trendType() === 'neutral'"
            >
              {{ trend() }}
            </span>
          }
        </div>
        @if (description()) {
          <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ description() }}</p>
        }
      </div>
      
      <!-- Icon Slot -->
      <div 
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        [class.bg-ag-green-50]="color() === 'green'"
        [class.text-ag-green-600]="color() === 'green'"
        [class.dark:bg-ag-green-950/20]="color() === 'green'"
        [class.dark:text-ag-green-400]="color() === 'green'"
        [class.bg-ag-earth-50]="color() === 'earth'"
        [class.text-ag-earth-600]="color() === 'earth'"
        [class.dark:bg-ag-earth-950/20]="color() === 'earth'"
        [class.dark:text-ag-earth-400]="color() === 'earth'"
        [class.bg-ag-water-50]="color() === 'water'"
        [class.text-ag-water-600]="color() === 'water'"
        [class.dark:bg-ag-water-950/20]="color() === 'water'"
        [class.dark:text-ag-water-400]="color() === 'water'"
        [class.bg-ag-gold-50]="color() === 'gold'"
        [class.text-ag-gold-600]="color() === 'gold'"
        [class.dark:bg-ag-gold-950/20]="color() === 'gold'"
        [class.dark:text-ag-gold-400]="color() === 'gold'"
        [class.bg-zinc-100]="color() === 'zinc'"
        [class.text-zinc-600]="color() === 'zinc'"
        [class.dark:bg-zinc-800]="color() === 'zinc'"
        [class.dark:text-zinc-400]="color() === 'zinc'"
      >
        <ng-content select="[icon]"></ng-content>
      </div>
    </div>
  `
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  trend = input<string>();
  trendType = input<'up' | 'down' | 'neutral'>('neutral');
  description = input<string>();
  color = input<'green' | 'earth' | 'water' | 'gold' | 'zinc'>('zinc');
}
