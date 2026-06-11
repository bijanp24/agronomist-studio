import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RanchStore } from './core/store/ranch.store';
import { FieldStore } from './core/store/field.store';
import { ToastContainerComponent } from './shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class App implements OnInit {
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly router = inject(Router);

  // Shell UI states
  protected readonly sidebarOpen = signal(false);
  protected readonly ranchDropdownOpen = signal(false);
  protected readonly currentRouteName = signal('Dashboard');

  constructor() {
    // Sync current route name for breadcrumbs
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects || event.url || '';
      if (url.includes('/dashboard')) {
        this.currentRouteName.set('Dashboard');
      } else if (url.includes('/fields')) {
        this.currentRouteName.set('Fields & Ranches');
      } else if (url.includes('/gis')) {
        this.currentRouteName.set('GIS Spatial Engine');
      } else if (url.includes('/scouting')) {
        this.currentRouteName.set('Scouting Reports');
      } else if (url.includes('/water')) {
        this.currentRouteName.set('Water & Irrigation');
      } else if (url.includes('/pest')) {
        this.currentRouteName.set('Pest & PCA');
      } else if (url.includes('/nutrients')) {
        this.currentRouteName.set('Nutrients & Tissue');
      } else if (url.includes('/planning')) {
        this.currentRouteName.set('Crop Planning');
      } else {
        this.currentRouteName.set('Dashboard');
      }
      // Close sidebar on navigation (for mobile)
      this.sidebarOpen.set(false);
    });

    // Auto-reload fields whenever the selected ranch changes
    effect(() => {
      const ranchId = this.ranchStore.selectedRanchId();
      this.fieldStore.loadFields(ranchId);
    });
  }

  ngOnInit() {
    // Initial fetch
    this.ranchStore.loadRanches();
    this.fieldStore.loadFields(null);
  }

  protected toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  protected closeSidebar() {
    this.sidebarOpen.set(false);
  }

  protected toggleRanchDropdown(event: Event) {
    event.stopPropagation();
    this.ranchDropdownOpen.update(v => !v);
  }

  protected selectRanch(ranchId: string | null) {
    this.ranchStore.selectRanch(ranchId);
    this.ranchDropdownOpen.set(false);
  }

  protected onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.ranchStore.setSearchQuery(input.value);
  }

  protected onDocumentClick(event: MouseEvent) {
    // Close dropdowns when clicking outside
    this.ranchDropdownOpen.set(false);
  }
}
