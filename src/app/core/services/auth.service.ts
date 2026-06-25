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

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) {}

  // ── Login / Logout ────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(resp => {
        localStorage.setItem(this.TOKEN_KEY, resp.token);
        localStorage.setItem(this.USER_KEY,  resp.username);
        localStorage.setItem(this.ROL_KEY,   resp.rol);
        this.loggedIn$.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROL_KEY);
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  // ── Estado ────────────────────────────────────────────────────

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
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

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
