import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginRequest, LoginResponse, RefreshRequest } from '../models';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = environment.apiUrl;

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/api/auth/login`, request)
      .pipe(tap((res) => this.setTokens(res.accessToken, res.refreshToken)));
  }

  refreshToken(): Observable<LoginResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }
    const body: RefreshRequest = { refreshToken };
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/refresh`, body).pipe(
      tap((res) => this.setTokens(res.accessToken, res.refreshToken)),
      catchError(() => {
        this.clearTokens();
        return of(null);
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.router.navigate(['/admin/login']);
  }

  getAccessToken(): string | null {
    return this.storage?.getItem(ACCESS_TOKEN_KEY) ?? null;
  }

  getRefreshToken(): string | null {
    return this.storage?.getItem(REFRESH_TOKEN_KEY) ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.storage?.setItem(ACCESS_TOKEN_KEY, accessToken);
    this.storage?.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  clearTokens(): void {
    this.storage?.removeItem(ACCESS_TOKEN_KEY);
    this.storage?.removeItem(REFRESH_TOKEN_KEY);
  }
}
