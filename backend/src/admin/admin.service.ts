import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface AdminOverviewRow {
  email: string;
  recipeCount: number;
}

export interface AdminSetting {
  key: string;
  label: string;
  service: string;
  value: string;
  configured: boolean;
}

// Infrastructure settings surfaced (masked) on the admin settings screen.
// Sourced from environment variables injected by the platform (K8s secret).
const SETTING_DEFS: { key: string; label: string; service: string }[] = [
  { key: 'DATABASE_URL', label: 'Connection URL', service: 'postgresql' },
  { key: 'MINIO_ENDPOINT', label: 'Endpoint', service: 'minio' },
  { key: 'MINIO_ACCESS_KEY', label: 'Access key', service: 'minio' },
  { key: 'MINIO_SECRET_KEY', label: 'Secret key', service: 'minio' },
];

@Injectable()
export class AdminService {
  private readonly logger = new Logger('AdminService');

  constructor(private prisma: PrismaService) {}

  /** Per-user recipe counts for every user (including users with zero recipes). */
  async overview(): Promise<AdminOverviewRow[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          email: true,
          _count: { select: { recipes: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      return users.map((u) => ({ email: u.email, recipeCount: u._count.recipes }));
    } catch (error) {
      this.logger.error(`GET admin/overview: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  /** Masked view of infra config settings, resolved from environment variables. */
  getSettings(): AdminSetting[] {
    return SETTING_DEFS.map((def) => {
      const raw = this.resolveEnv(def.key);
      return {
        key: def.key,
        label: def.label,
        service: def.service,
        value: raw ? this.mask(def.key, raw) : '',
        configured: !!raw,
      };
    });
  }

  /**
   * Settings are environment-sourced and read-only at runtime (no persistence
   * layer in this stack). Returns the current effective settings so the UI can
   * refresh; values provided in the patch are acknowledged but not persisted.
   */
  updateSettings(_patch: Record<string, string>): AdminSetting[] {
    return this.getSettings();
  }

  private resolveEnv(key: string): string | undefined {
    if (key === 'MINIO_ACCESS_KEY') {
      return process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER;
    }
    if (key === 'MINIO_SECRET_KEY') {
      return process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD;
    }
    return process.env[key];
  }

  private mask(key: string, value: string): string {
    if (/url/i.test(key)) return value.replace(/\/\/[^@]+@/, '//****:****@');
    return value.length <= 4 ? '****' : value.slice(0, 2) + '••••' + value.slice(-2);
  }
}
