import { Injectable, signal, computed, PLATFORM_ID, Inject, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';
import { ProductRepositoryImpl } from '../../../data/repositories/product.repository.impl';

const GUEST_ID_KEY = 'lk-guest-id';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private http = inject(HttpClient);
  private productRepo = inject(ProductRepositoryImpl);
  private favoriteIdsSignal = signal<string[]>([]);
  public favoriteProductIds = this.favoriteIdsSignal.asReadonly();
  private guestId = '';

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.guestId = localStorage.getItem(GUEST_ID_KEY) || crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, this.guestId);
      this.fetchFavorites();
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-Guest-Id': this.guestId });
  }

  fetchFavorites() {
    this.http.get<any>(`${environment.apiBaseUrl}/favorites`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        const ids = (res?.data || res || []).map((f: any) => String(f.productId || f.id).toLowerCase());
        this.favoriteIdsSignal.set(ids);
      },
      error: (err: any) => console.error(err)
    });
  }

  /** Some pages still carry catalogue keys like "prod-1"; the API only knows product GUIDs. */
  private toKey(productId: string): string {
    return this.productRepo.getRealProductId(productId).toLowerCase();
  }

  toggleFavorite(rawProductId: string) {
    const productId = this.toKey(rawProductId);
    const current = this.favoriteIdsSignal();
    const exists = current.includes(productId);
    
    this.favoriteIdsSignal.set(exists ? current.filter(id => id !== productId) : [...current, productId]);

    if (exists) {
      this.http.delete<any>(`${environment.apiBaseUrl}/favorites/${productId}`, { headers: this.getHeaders() }).subscribe({
        error: (err: any) => this.fetchFavorites()
      });
    } else {
      this.http.post<any>(`${environment.apiBaseUrl}/favorites/${productId}`, {}, { headers: this.getHeaders() }).subscribe({
        error: (err: any) => this.fetchFavorites()
      });
    }
  }

  removeFavorite(productId: string) {
    if (this.isFavorite(productId)) {
      this.toggleFavorite(productId);
    }
  }

  clearFavorites() {
    this.favoriteIdsSignal.set([]);
    this.fetchFavorites();
  }

  isFavorite(productId: string): boolean {
    return this.favoriteProductIds().includes(this.toKey(productId));
  }
}
