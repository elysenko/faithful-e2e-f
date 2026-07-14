import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminOverviewRow } from '../../core/models';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.css',
})
export class AdminOverviewComponent {
  // Data contract: mockup_cleaner empties this signal; service_agent wires it to
  // AdminService.overview() in ngOnInit.
  rows = signal<AdminOverviewRow[]>([
    { email: 'admin@faithfulf.dev', recipeCount: 3 },
    { email: 'demo@faithfulf.dev', recipeCount: 7 },
    { email: 'maria@example.com', recipeCount: 5 },
    { email: 'georgi@example.com', recipeCount: 2 },
    { email: 'elena@example.com', recipeCount: 0 },
  ]);

  loading = signal(false);
  error = signal<string | null>(null);

  totalUsers = computed(() => this.rows().length);
  totalRecipes = computed(() => this.rows().reduce((sum, r) => sum + r.recipeCount, 0));
}
