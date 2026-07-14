import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, UserRole } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Mockup auth service. Persists a lightweight session in localStorage so the
 * whole authenticated UI is reviewable without a live backend. The service_agent
 * stage replaces the mock login/register bodies with real HTTP calls to
 * POST /api/auth/login and POST /api/auth/register.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor(private router: Router) {}

  /** Mock login — accepts any credentials; an email containing "admin" gets ADMIN. */
  login(email: string, _password: string): void {
    const role: UserRole = /admin/i.test(email) ? 'ADMIN' : 'USER';
    this.persist({ id: 'u-' + email, email, role });
  }

  /** Mock register — creates a USER session (public signup always creates USER). */
  register(email: string, _password: string): void {
    this.persist({ id: 'u-' + email, email, role: 'USER' });
  }

  /** Demo Mode — seeds an ADMIN session and jumps into the app. */
  demoLogin(): void {
    this.persist({ id: 'demo-admin', email: 'admin@faithfulf.dev', role: 'ADMIN' });
    this.router.navigate(['/recipes']);
  }

  logout(): void {
    [TOKEN_KEY, 'access_token', 'token', USER_KEY, 'user', 'isAuthenticated'].forEach((k) =>
      localStorage.removeItem(k),
    );
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private persist(user: AuthUser): void {
    const mockToken = 'demo.' + btoa(user.email) + '.jwt';
    // Mirror common key names so guards/screenshot tooling recognise the session.
    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.setItem('token', mockToken);
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    this._user.set(user);
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
