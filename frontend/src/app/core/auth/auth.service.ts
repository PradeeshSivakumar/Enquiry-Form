import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.baseUrl + '/api/auth';

  currentUser = signal<User | null>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    this.clearLegacyLocalStorage();

    if (!this.isAuthenticated()) {
      return;
    }

    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.currentUser.set(JSON.parse(userStr));
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUser.set(response.user);
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  changePassword(payload: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/change-password`, payload);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getUserRole(): string | null {
    const current = this.currentUser();
    if (current?.role) {
      return current.role;
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    return this.decodeToken(token)?.role ?? null;
  }

  hasRole(roles: string | string[]): boolean {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const userRole = this.getUserRole();

    if (!userRole) {
      return false;
    }

    return allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase());
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    return !payload || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  }

  private decodeToken(token: string): any | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return null;
      }

      const base64Url = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const base64 = base64Url.padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  private clearSession() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    this.currentUser.set(null);
  }

  private clearLegacyLocalStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }
}
