import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, UserRole } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/** Raw payload returned by POST /api/auth/{login,register}. */
interface AuthResponse {
  user: {
    id: string;
    name?: string;
    email: string;
    role: string; // backend enum is lowercase: 'admin' | 'user'
    image?: string;
    createdAt?: string;
  };
  token: string;
}

/**
 * Live auth service. Talks to the NestJS backend at POST /api/auth/login and
 * POST /api/auth/register, persists the JWT (read by authInterceptor + authGuard)
 * and a normalised session user in localStorage, and exposes reactive signals for
 * the guards/navbar. The backend `role` enum is lowercase (admin|user); it is
 * normalised to the frontend UserRole ('ADMIN'|'USER') on the way in.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  private _user = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  /** Live login — POST /api/auth/login → { user, token }. */
  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, { email: email.trim(), password })
      .pipe(map((res) => this.handleAuth(res)));
  }

  /**
   * Live register — POST /api/auth/register. Public signup always creates a USER.
   * The backend requires a name and a password confirmation, so both are sent.
   */
  register(name: string, email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, {
        name: name.trim(),
        email: email.trim(),
        password,
        passwordconf: password,
      })
      .pipe(map((res) => this.handleAuth(res)));
  }

  /**
   * Demo Mode — logs in against the seeded admin (admin@example.com). The seed
   * derives the password as sha256(email + SEED_SECRET).slice(0,16) with the
   * default secret, so the demo works out-of-the-box against a seeded database.
   */
  demoLogin(): void {
    const email = 'admin@example.com';
    from(this.derivePassword(email))
      .pipe(switchMap((password) => this.login(email, password)))
      .subscribe({
        next: () => this.router.navigate(['/recipes']),
        error: () => this.router.navigate(['/login']),
      });
  }

  logout(): void {
    [TOKEN_KEY, 'access_token', 'token', USER_KEY, 'user', 'isAuthenticated'].forEach((k) =>
      localStorage.removeItem(k),
    );
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /** Persist the session from a backend auth response and return the mapped user. */
  private handleAuth(res: AuthResponse): AuthUser {
    const user: AuthUser = {
      id: res.user.id,
      email: res.user.email,
      role: this.normaliseRole(res.user.role),
    };
    this.persist(user, res.token);
    return user;
  }

  private normaliseRole(role: string): UserRole {
    return String(role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
  }

  private persist(user: AuthUser, token: string): void {
    // Mirror common key names so guards/screenshot tooling recognise the session.
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
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

  /** Mirrors the backend seed's deterministic password derivation. */
  private async derivePassword(email: string): Promise<string> {
    const secret = 'colossus-seed';
    const data = new TextEncoder().encode(email + secret);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  }
}
