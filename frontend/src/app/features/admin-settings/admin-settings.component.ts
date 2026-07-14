import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSetting } from '../../core/models';
import { AdminService } from '../../core/services/admin.service';

interface ServiceGroup {
  service: string;
  label: string;
  icon: string;
  keys: AdminSetting[];
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent implements OnInit {
  // Live data: masked infra settings resolved from the backend environment
  // (GET /api/admin/settings). Values are env-sourced and read-only at runtime.
  settings = signal<AdminSetting[]>([]);

  // Editable draft values keyed by setting key.
  draft = signal<Record<string, string>>({});
  savedService = signal<string | null>(null);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getSettings().subscribe({
      next: (settings) => this.settings.set(settings),
      error: () => {},
    });
  }

  private meta: Record<string, { label: string; icon: string }> = {
    postgresql: { label: 'PostgreSQL', icon: '🐘' },
    minio: { label: 'MinIO object storage', icon: '🪣' },
  };

  groups = computed<ServiceGroup[]>(() => {
    const bySvc = new Map<string, AdminSetting[]>();
    for (const s of this.settings()) {
      if (!bySvc.has(s.service)) bySvc.set(s.service, []);
      bySvc.get(s.service)!.push(s);
    }
    return Array.from(bySvc.entries()).map(([service, keys]) => ({
      service,
      label: this.meta[service]?.label ?? service,
      icon: this.meta[service]?.icon ?? '🔧',
      keys,
    }));
  });

  isConfigured(group: ServiceGroup): boolean {
    return group.keys.every((k) => k.configured);
  }

  updateDraft(key: string, value: string): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  saveService(group: ServiceGroup): void {
    const draftValues = this.draft();
    // Only submit the (non-empty) draft values for this service group.
    const patch: Record<string, string> = {};
    for (const setting of group.keys) {
      const entered = draftValues[setting.key];
      if (entered && entered.trim().length > 0) {
        patch[setting.key] = entered.trim();
      }
    }

    this.adminService.updateSettings(patch).subscribe({
      next: (settings) => {
        // Backend returns the current effective (masked) settings.
        this.settings.set(settings);
        this.savedService.set(group.service);
      },
      error: () => {},
    });
  }
}
