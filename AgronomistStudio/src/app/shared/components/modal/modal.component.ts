import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-end" role="dialog" aria-modal="true">
        
        <!-- Overlay backdrop -->
        <div 
          class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          (click)="close()"
        ></div>

        <!-- Dialog Body / Slide Over Panel -->
        <div 
          class="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col justify-between z-10 dark:bg-zinc-900 animate-slide-left"
        >
          <!-- Modal Header -->
          <div class="h-16 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">{{ title() }}</h2>
              @if (subtitle()) {
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{{ subtitle() }}</p>
              }
            </div>
            <button 
              (click)="close()"
              class="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-all dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="Close panel"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Scrollable Content Slot -->
          <div class="flex-1 overflow-y-auto p-6">
            <ng-content></ng-content>
          </div>

          <!-- Modal Footer Actions Slot -->
          <div class="px-6 py-4.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <button 
              (click)="close()"
              class="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <ng-content select="[actions]"></ng-content>
          </div>

        </div>

      </div>
    }
  `,
  styles: `
    @keyframes slide-left {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-left {
      animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `
})
export class ModalComponent {
  isOpen = input.required<boolean>();
  title = input.required<string>();
  subtitle = input<string>();

  closed = output<void>();

  protected close() {
    this.closed.emit();
  }
}
