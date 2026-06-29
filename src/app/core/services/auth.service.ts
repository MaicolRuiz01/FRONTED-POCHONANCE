import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface AuthResponse {
  token: string;
  username: string;
  rol: 'ADMIN' | 'OPERARIO';
}

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY   = 'poch_token';
  private readonly USER_KEY    = 'poch_user';
  private readonly ROL_KEY     = 'poch_rol';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());

  /** Temporizador que cierra la sesión justo cuando el JWT expira (aunque el usuario esté inactivo). */
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private router: Router) {
    // Si al abrir la app ya hay un token válido, programa el auto-logout para cuando venza.
    this.scheduleAutoLogout();
  }

  // ── Login / Logout ────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(resp => {
        localStorage.setItem(this.TOKEN_KEY, resp.token);
        localStorage.setItem(this.USER_KEY,  resp.username);
        localStorage.setItem(this.ROL_KEY,   resp.rol);
        this.loggedIn$.next(true);
        this.scheduleAutoLogout();
      })
    );
  }

  /**
   * Cierra la sesión y manda al login.
   * @param expired  true si fue por expiración del token (muestra aviso al usuario).
   */
  logout(expired = false): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROL_KEY);
    this.clearAutoLogout();
    this.loggedIn$.next(false);
    this.router.navigate(['/login'], expired ? { queryParams: { expired: 'true' } } : {});
  }

  // ── Estado ────────────────────────────────────────────────────

  /** Logueado = hay token Y no está vencido. */
  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  /** ¿Existe un token guardado? (sin importar si está vencido). Útil para distinguir "expiró" de "nunca entró". */
  hasStoredToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsername(): string {
    return localStorage.getItem(this.USER_KEY) ?? '';
  }

  getRol(): 'ADMIN' | 'OPERARIO' | null {
    const rol = localStorage.getItem(this.ROL_KEY);
    return (rol === 'ADMIN' || rol === 'OPERARIO') ? rol : null;
  }

  isAdmin(): boolean {
    return this.getRol() === 'ADMIN';
  }

  isOperario(): boolean {
    return this.getRol() === 'OPERARIO';
  }

  // ── Manejo de expiración del JWT ──────────────────────────────

  /** ¿El token está vencido? (lee el claim 'exp' del propio JWT). */
  isTokenExpired(): boolean {
    const expMs = this.getTokenExpirationMs();
    if (expMs === null) return false; // sin claim exp → no podemos saber, no forzamos logout
    return Date.now() >= expMs;
  }

  /** Fecha de expiración del token en milisegundos, o null si no se puede leer. */
  getTokenExpirationMs(): number | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload?.exp ? payload.exp * 1000 : null;
  }

  private hasValidToken(): boolean {
    return this.hasStoredToken() && !this.isTokenExpired();
  }

  /** Decodifica el payload (parte central) de un JWT. Devuelve null si falla. */
  private decodeToken(token: string): any | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
      return JSON.parse(atob(base64 + pad));
    } catch {
      return null;
    }
  }

  /** Programa el cierre de sesión automático para el momento exacto en que el token vence. */
  private scheduleAutoLogout(): void {
    this.clearAutoLogout();
    const expMs = this.getTokenExpirationMs();
    if (expMs === null) return;
    const restante = expMs - Date.now();
    if (restante <= 0) return; // ya venció: lo manejan el guard / interceptor
    this.logoutTimer = setTimeout(() => this.logout(true), restante);
  }

  private clearAutoLogout(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }
}
