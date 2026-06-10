import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @if (type() === 'card') {
      <div class="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 animate-pulse space-y-4">
        <div class="flex items-start justify-between">
          <div class="space-y-2 flex-1">
            <div class="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div class="h-6 w-1/2 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
        </div>
        <div class="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
    } @else if (type() === 'table-row') {
      <tr class="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
        @for (col of [1,2,3,4,5]; track col) {
          <td class="px-6 py-4.5">
            <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded" [style.width.%]="col === 1 ? 60 : (col === 4 ? 40 : 80)"></div>
          </td>
        }
      </tr>
    } @else {
      <!-- Default Text list skeleton -->
      <div class="animate-pulse space-y-3">
        <div class="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-3/4"></div>
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
      </div>
    }
  `
})
export class SkeletonComponent {
  type = input<'card' | 'table-row' | 'text'>('text');
}
