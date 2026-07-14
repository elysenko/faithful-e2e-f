import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSetting } from '../../core/models';

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
export class AdminSettingsComponent {
  // Data contract: mockup_cleaner empties this signal; service_agent wires it to
  // AdminService.getSettings() in ngOnInit and updateSettings() on save.
  settings = signal<AdminSetting[]>([
    { key: 'DATABASE_URL', label: 'Connection URL', service: 'postgresql', value: 'postgres://****:****@db:5432/recipes', configured: true },
    { key: 'MINIO_ENDPOINT', label: 'Endpoint', service: 'minio', value: '', configured: false },
    { key: 'MINIO_ACCESS_KEY', label: 'Access key', service: 'minio', value: '', configured: false },
    { key: 'MINIO_SECRET_KEY', label: 'Secret key', service: 'minio', value: '', configured: false },
  ]);

  // Editable draft values keyed by setting key.
  draft = signal<Record<string, string>>({});
  savedService = signal<string | null>(null);

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
    this.settings.update((list) =>
      list.map((s) => {
        if (s.service !== group.service) return s;
        const entered = draftValues[s.key];
        if (entered && entered.trim().length > 0) {
          return { ...s, configured: true, value: this.mask(s.key, entered) };
        }
        return s;
      }),
    );
    this.savedService.set(group.service);
  }

  private mask(key: string, value: string): string {
    if (/url/i.test(key)) return value.replace(/\/\/[^@]+@/, '//****:****@');
    return value.length <= 4 ? '****' : value.slice(0, 2) + '••••' + value.slice(-2);
  }
}
