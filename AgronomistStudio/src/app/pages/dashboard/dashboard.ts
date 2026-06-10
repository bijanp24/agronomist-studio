import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-semibold text-ag-green-800">Dashboard</h1>
      <p class="text-zinc-600 mt-2">Welcome to Agronomist Studio. Select a ranch to get started.</p>
    </div>
  `
})
export default class DashboardPage {}
