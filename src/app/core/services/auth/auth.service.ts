import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole, isStaffRole } from '../../models/user.model';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  user = signal<User | null>(null);
  isAdmin = computed(() => isStaffRole(this.user()?.role));

  constructor() {
  }

  isAuthenticated(): boolean {
    if (this.user() !== null) return true;
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return false;
      }
      return Boolean(payload.sub || payload.nameid);
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        window.localStorage.setItem('lk-auth-token', urlToken);
        
        // Remove token from URL
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('token');
        window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
        
        return urlToken;
      }

      return window.localStorage.getItem('lk-auth-token');
    }
    return null;
  }

  // The CRM's «Lavva System» link signs the admin in on the API with the .Lavva.Session cookie, which
  // is HttpOnly, so nothing here can see it — without this step the app finds no token and the guards
  // send the admin to /admin/login. Trade the cookie for the same token a normal admin login issues.
  // Only on the dashboard: a shopper on the storefront never holds this cookie.
  private async adoptSsoSession(): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (!window.location.pathname.startsWith('/admin')) return null;

    try {
      const url = `${environment.apiBaseUrl || '/api'}/sso/session-token`;
      const res = await firstValueFrom(this.http.get<any>(url, { withCredentials: true }));
      const token = res?.token ?? res?.data?.token;

      if (typeof token === 'string' && token.length > 0) {
        window.localStorage.setItem('lk-auth-token', token);
        return token;
      }
    } catch {
      // No SSO session (401) or no longer an active admin (403): simply not signed in.
    }

    return null;
  }

  async fetchUser(): Promise<User | null> {
    const token = this.getToken() ?? await this.adoptSsoSession();
    if (!token) {
      this.setUser(null);
      return null;
    }

    let tokenPayload: any = null;
    try {
      tokenPayload = JSON.parse(atob(token.split('.')[1]));
      if (tokenPayload.exp && tokenPayload.exp < Date.now() / 1000) {
        this.setUser(null);
        return null;
      }
    } catch {
      this.setUser(null);
      return null;
    }

    try {
      const url = `${environment.apiBaseUrl || '/api'}/users/me`;
      const res = await firstValueFrom(this.http.get<any>(url, { withCredentials: true }));

      // لو الـ response فيها success/isSuccess نتأكد منها، ولو مفيش wrapper خالص نعتبرها ok
      const isOk = res?.success !== undefined
        ? res.success
        : (res?.isSuccess !== undefined ? res.isSuccess : true);

      const data = res?.data ?? res;

      if (isOk && data && data.id) {
        const userObj: User = {
          id: data.id,
          name: data.name || tokenPayload?.unique_name || 'Customer',
          email: data.email || (Array.isArray(tokenPayload?.email) ? tokenPayload.email[0] : tokenPayload?.email) || '',
          role: (data.role || tokenPayload?.role || tokenPayload?.Role || 'customer').toLowerCase() as UserRole
        };
        this.user.set(userObj);
        return userObj;
      }
    } catch { }

    if (tokenPayload && (tokenPayload.sub || tokenPayload.nameid)) {
      const userObj: User = {
        id: tokenPayload.sub || tokenPayload.nameid,
        name: tokenPayload.unique_name || 'Customer',
        email: (Array.isArray(tokenPayload?.email) ? tokenPayload.email[0] : tokenPayload?.email) || '',
        role: (tokenPayload.role || 'customer').toLowerCase() as UserRole
      };
      this.user.set(userObj);
      return userObj;
    }

    this.user.set(null);
    return null;
  }

  setUser(nextUser: User | null) {
    this.user.set(nextUser);
    if (!nextUser && isPlatformBrowser(this.platformId)) {
      window.localStorage.removeItem('lk-auth-token');
    }
  }
}