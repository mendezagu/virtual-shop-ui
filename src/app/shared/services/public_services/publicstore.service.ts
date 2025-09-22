// store.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PublicStoreService {
  // usa SOLO apiUrl del environment
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener info de la tienda
  getStoreBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/stores/public/${slug}`);
  }

  // Obtener productos de la tienda
  getProductsBySlug(slug: string, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get(`${this.apiUrl}/products/public/store/${slug}`, { params });
  }

  // Obtener producto individual por ID
  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`);
  }

  // Categorías de la tienda
  getCategories(slug: string): Observable<{ data: { name: string; slug: string; count: number; imageUrl?: string | null }[] }> {
    return this.http.get<{ data: { name: string; slug: string; count: number; imageUrl?: string | null }[] }>(
      `${this.apiUrl}/products/public/store/${slug}/categories`
    );
  }

  // Productos por categoría
  getProductsByCategory(slug: string, categorySlug: string, page = 1, limit = 12): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get(
      `${this.apiUrl}/products/public/store/${slug}/by-category/${categorySlug}`,
      { params }
    );
  }
}
