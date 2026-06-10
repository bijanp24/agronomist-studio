import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      
      <!-- Top Filters / Header Slot (Optional) -->
      <div class="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="font-semibold text-zinc-900 dark:text-white">{{ title() }}</h3>
          @if (subtitle()) {
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{{ subtitle() }}</p>
          }
        </div>
        <div class="flex items-center gap-3">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>

      <!-- Scrollable Table Wrapper -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-zinc-50/50 border-b border-zinc-100 dark:bg-zinc-900/40 dark:border-zinc-800">
              @for (col of columns(); track col.key) {
                <th 
                  scope="col" 
                  class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none"
                  [class.cursor-pointer]="col.sortable"
                  [class.hover:text-zinc-700]="col.sortable"
                  [class.dark:hover:text-zinc-300]="col.sortable"
                  (click)="toggleSort(col)"
                >
                  <div class="flex items-center gap-1.5">
                    <span>{{ col.label }}</span>
                    @if (col.sortable) {
                      @if (sortKey() === col.key) {
                        @if (sortDirection() === 'asc') {
                          <svg class="w-3.5 h-3.5 text-ag-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                          </svg>
                        } @else {
                          <svg class="w-3.5 h-3.5 text-ag-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        }
                      } @else {
                        <svg class="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                        </svg>
                      }
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
            @if (isLoading()) {
              @for (row of [1,2,3]; track row) {
                <tr class="animate-pulse">
                  @for (col of columns(); track col.key) {
                    <td class="px-6 py-4.5">
                      <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                    </td>
                  }
                </tr>
              }
            } @else if (sortedData().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length" class="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
                  <div class="flex flex-col items-center justify-center gap-3">
                    <svg class="w-10 h-10 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span>No records found</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (row of sortedData(); track row[idKey()]) {
                <tr 
                  class="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  [class.cursor-pointer]="rowClickable()"
                  (click)="onRowClick(row)"
                >
                  @for (col of columns(); track col.key) {
                    <td class="px-6 py-4.5 text-zinc-700 dark:text-zinc-300 align-middle">
                      <!-- Render either cell slot, cell template, or default value -->
                      <ng-container *ngTemplateOutlet="cellTemplateSlot(); context: { $implicit: row, column: col, value: row[col.key] }">
                      </ng-container>
                      @if (!cellTemplateSlot()) {
                        {{ row[col.key] }}
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class DataTableComponent<T extends Record<string, any>> {
  title = input.required<string>();
  subtitle = input<string>();
  columns = input.required<TableColumn<T>[]>();
  data = input.required<T[]>();
  idKey = input<string>('id');
  isLoading = input<boolean>(false);
  rowClickable = input<boolean>(false);
  cellTemplateSlot = input<any>(); // Allows passing templates for cell formatting

  rowClick = output<T>();

  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');

  protected readonly sortedData = computed(() => {
    const list = [...this.data()];
    const key = this.sortKey();
    const dir = this.sortDirection();

    if (!key) return list;

    return list.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return dir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return dir === 'asc' ? -1 : 1;
      if (strA > strB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  protected toggleSort(column: TableColumn<T>) {
    if (!column.sortable) return;

    if (this.sortKey() === column.key) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortKey.set(null);
      }
    } else {
      this.sortKey.set(column.key as string);
      this.sortDirection.set('asc');
    }
  }

  protected onRowClick(row: T) {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }
}
