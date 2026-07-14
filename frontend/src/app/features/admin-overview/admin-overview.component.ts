import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminOverviewRow } from '../../core/models';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.css',
})
export class AdminOverviewComponent implements OnInit {
  // Live data: per-user recipe counts from AdminService.overview() (GET /api/admin/overview).
  rows = signal<AdminOverviewRow[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);

  totalUsers = computed(() => this.rows().length);
  totalRecipes = computed(() => this.rows().reduce((sum, r) => sum + r.recipeCount, 0));

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.overview().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the admin overview. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
