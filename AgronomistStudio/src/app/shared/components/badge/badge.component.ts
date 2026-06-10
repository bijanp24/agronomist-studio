import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span 
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border tracking-wide uppercase transition-colors"
      [class.bg-emerald-50]="type() === 'success' || type() === 'healthy'"
      [class.text-emerald-700]="type() === 'success' || type() === 'healthy'"
      [class.border-emerald-200]="type() === 'success' || type() === 'healthy'"
      [class.dark:bg-emerald-950/20]="type() === 'success' || type() === 'healthy'"
      [class.dark:text-emerald-400]="type() === 'success' || type() === 'healthy'"
      [class.dark:border-emerald-900/50]="type() === 'success' || type() === 'healthy'"
      
      [class.bg-amber-50]="type() === 'warning' || type() === 'needs-attention'"
      [class.text-amber-700]="type() === 'warning' || type() === 'needs-attention'"
      [class.border-amber-200]="type() === 'warning' || type() === 'needs-attention'"
      [class.dark:bg-amber-950/20]="type() === 'warning' || type() === 'needs-attention'"
      [class.dark:text-amber-400]="type() === 'warning' || type() === 'needs-attention'"
      [class.dark:border-amber-900/50]="type() === 'warning' || type() === 'needs-attention'"
      
      [class.bg-rose-50]="type() === 'danger' || type() === 'critical'"
      [class.text-rose-700]="type() === 'danger' || type() === 'critical'"
      [class.border-rose-200]="type() === 'danger' || type() === 'critical'"
      [class.dark:bg-rose-950/20]="type() === 'danger' || type() === 'critical'"
      [class.dark:text-rose-400]="type() === 'danger' || type() === 'critical'"
      [class.dark:border-rose-900/50]="type() === 'danger' || type() === 'critical'"
      
      [class.bg-blue-50]="type() === 'info' || type() === 'active'"
      [class.text-blue-700]="type() === 'info' || type() === 'active'"
      [class.border-blue-200]="type() === 'info' || type() === 'active'"
      [class.dark:bg-blue-950/20]="type() === 'info' || type() === 'active'"
      [class.dark:text-blue-400]="type() === 'info' || type() === 'active'"
      [class.dark:border-blue-900/50]="type() === 'info' || type() === 'active'"

      [class.bg-zinc-50]="type() === 'zinc' || type() === 'scheduled' || type() === 'draft'"
      [class.text-zinc-600]="type() === 'zinc' || type() === 'scheduled' || type() === 'draft'"
      [class.border-zinc-200]="type() === 'zinc' || type() === 'scheduled' || type() === 'draft'"
      [class.dark:bg-zinc-800/40]="type() === 'zinc' || type() === 'scheduled' || type() === 'draft'"
      [class.dark:text-zinc-400]="type() === 'zinc' || type() === 'scheduled' || type() === 'draft'"
      [class.dark:border-zinc-800]="type() === 'zinc' || type() === 'scheduled' || type() === 'draft'"
    >
      <span class="w-1.5 h-1.5 rounded-full"
        [class.bg-emerald-500]="type() === 'success' || type() === 'healthy'"
        [class.bg-amber-500]="type() === 'warning' || type() === 'needs-attention'"
        [class.bg-rose-500]="type() === 'danger' || type() === 'critical'"
        [class.bg-blue-500]="type() === 'info' || type() === 'active'"
        [class.bg-zinc-400]="type() === 'zinc' || type() === 'scheduled' || type() === 'draft'"
      ></span>
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  type = input<'success' | 'healthy' | 'warning' | 'needs-attention' | 'danger' | 'critical' | 'info' | 'active' | 'zinc' | 'scheduled' | 'draft'>('zinc');
}
