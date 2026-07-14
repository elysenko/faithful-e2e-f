import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminOverviewRow, AdminSetting } from '../models';

/**
 * HTTP client for the admin-only endpoints
 * (GET /api/admin/overview, GET/PATCH /api/admin/settings).
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  overview(): Observable<AdminOverviewRow[]> {
    return this.http.get<AdminOverviewRow[]>(`${this.base}/overview`);
  }

  getSettings(): Observable<AdminSetting[]> {
    return this.http.get<AdminSetting[]>(`${this.base}/settings`);
  }

  updateSettings(patch: Record<string, string>): Observable<AdminSetting[]> {
    return this.http.patch<AdminSetting[]>(`${this.base}/settings`, patch);
  }
}
