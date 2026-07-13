import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../config/api-config';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  userId?: number;
  username: string;
  role: string;
  giftListId?: number;
}

export interface CreateCoupleAccessRequest {
  username: string;
  password: string;
  phoneNumber: string;
  giftListId: number;
  role: 'COUPLE';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = ApiConfig.baseUrl;

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { username, password })
      .pipe(
        tap(res => {
          if (res.token) {
            localStorage.setItem('jwt_token', res.token.trim());
            localStorage.setItem('username', res.username);
            localStorage.setItem('role', res.role);

            const claims = this.extractClaimsFromJwt(res.token);
            let resolvedUserId = res.userId;
            let resolvedGiftListId = res.giftListId;
            if (!resolvedUserId) {
              resolvedUserId = this.resolveNumberClaim(claims, ['userId', 'user_id', 'sub']) || undefined;
            }
            resolvedGiftListId = resolvedGiftListId || this.resolveNumberClaim(claims, ['giftListId', 'gift_list_id', 'listId', 'list_id']) || undefined;
            if (resolvedUserId) {
              localStorage.setItem('user_id', resolvedUserId.toString());
            }
            if (resolvedGiftListId) {
              localStorage.setItem('gift_list_id', resolvedGiftListId.toString());
            } else {
              localStorage.removeItem('gift_list_id');
            }
          }
        })
      );
  }

  createCoupleAccess(data: CreateCoupleAccessRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/auth/register/couple`, {
      username: data.username,
      password: data.password,
      phoneNumber: data.phoneNumber,
      giftListId: data.giftListId
    });
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('gift_list_id');
    sessionStorage.clear();
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('jwt_token');
    return !!token && token.trim().length > 0;
  }

  get currentUserId(): number | null {
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id, 10) : null;
  }

  get currentRole(): string | null {
    return localStorage.getItem('role');
  }

  get currentGiftListId(): number | null {
    const id = localStorage.getItem('gift_list_id');
    return id ? parseInt(id, 10) : null;
  }

  getDashboardRoute(role = this.currentRole): string {
    if (role === 'ADMIN') return '/superadmin/dashboard';
    if (role === 'COUPLE') return '/admin/dashboard';
    return '/admin/login';
  }

  private extractClaimsFromJwt(token: string): Record<string, unknown> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return {};

      let payload = parts[1];
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4 !== 0) {
        payload += '=';
      }

      const decoded = decodeURIComponent(
        atob(payload)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('Erro ao decodificar JWT no frontend:', e);
      return {};
    }
  }

  private resolveNumberClaim(claims: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = claims[key];
      const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
  }
}
