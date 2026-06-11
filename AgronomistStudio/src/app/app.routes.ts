import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard')
  },
  {
    path: 'fields',
    loadComponent: () => import('./pages/fields/fields')
  },
  {
    path: 'gis',
    loadComponent: () => import('./pages/gis/gis')
  },
  {
    path: 'ml-insights',
    loadComponent: () => import('./pages/ml-insights/ml-insights')
  },
  {
    path: 'upload',
    loadComponent: () => import('./pages/upload/upload')
  },
  {
    path: 'scouting',
    loadComponent: () => import('./pages/scouting/scouting')
  },
  {
    path: 'water',
    loadComponent: () => import('./pages/water/water')
  },
  {
    path: 'pest',
    loadComponent: () => import('./pages/pest/pest')
  },
  {
    path: 'nutrients',
    loadComponent: () => import('./pages/nutrients/nutrients')
  },
  {
    path: 'planning',
    loadComponent: () => import('./pages/planning/planning')
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
