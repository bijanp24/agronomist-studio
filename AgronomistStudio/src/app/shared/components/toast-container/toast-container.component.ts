import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white dark:bg-zinc-900 pointer-events-auto animate-slide-in transition-all duration-300"
          [class.border-emerald-200]="toast.type === 'success'"
          [class.bg-emerald-50/50]="toast.type === 'success'"
          [class.dark:border-emerald-950/35]="toast.type === 'success'"
          [class.dark:bg-emerald-950/15]="toast.type === 'success'"
          
          [class.border-amber-200]="toast.type === 'warning'"
          [class.bg-amber-50/50]="toast.type === 'warning'"
          [class.dark:border-amber-950/35]="toast.type === 'warning'"
          [class.dark:bg-amber-950/15]="toast.type === 'warning'"

          [class.border-rose-200]="toast.type === 'danger'"
          [class.bg-rose-50/50]="toast.type === 'danger'"
          [class.dark:border-rose-950/35]="toast.type === 'danger'"
          [class.dark:bg-rose-950/15]="toast.type === 'danger'"

          [class.border-zinc-200]="toast.type === 'info'"
          [class.dark:border-zinc-800]="toast.type === 'info'"
        >
          <!-- Toast Icon -->
          <div class="shrink-0 mt-0.5"
            [class.text-emerald-600]="toast.type === 'success'"
            [class.text-amber-600]="toast.type === 'warning'"
            [class.text-rose-600]="toast.type === 'danger'"
            [class.text-zinc-600]="toast.type === 'info'"
            [class.dark:text-emerald-400]="toast.type === 'success'"
            [class.dark:text-amber-400]="toast.type === 'warning'"
            [class.dark:text-rose-400]="toast.type === 'danger'"
            [class.dark:text-zinc-400]="toast.type === 'info'"
          >
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              }
              @case ('danger') {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
              @default {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.854l-.512 1.88a.75.75 0 001.063.854l.041-.02M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            }
          </div>

          <!-- Toast Message -->
          <div class="flex-1">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button 
            (click)="toastService.remove(toast.id)"
            class="shrink-0 p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @keyframes slide-in {
      from { transform: translateY(1.5rem) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
