import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}`;

  /** Cache por tienda (clave = storeSlug) */
  private categoryCache: Record<string, Observable<any>> = {};

  constructor(private http: HttpClient) {}

  /** 🔹 Crear categoría y limpiar cache de esa tienda */
  createCategory(
    storeId: string,
    name: string,
    parentId?: string,
    type: 'NORMAL' | 'PROMOCION' | 'DESTACADO' | 'OFERTA' = 'NORMAL'
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/category`, { storeId, name, parentId, type })
      .pipe(tap(() => this.clearCache())); // 👈 limpia cache global o podrías limpiar solo una tienda
  }

  /** 🔹 Actualizar categoría */
  updateCategory(categoryId: string, name: string): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/category/${categoryId}`, { name })
      .pipe(tap(() => this.clearCache()));
  }

  /** 🔹 Eliminar categoría */
  deleteCategory(categoryId: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/category/${categoryId}`)
      .pipe(tap(() => this.clearCache()));
  }

  /** 🔹 Obtener categorías públicas con cache y paginación */
  getCategories(
    storeSlug: string,
    page = 1,
    limit = 10,
    forceRefresh = false
  ): Observable<any> {
    const cacheKey = `${storeSlug}-p${page}-l${limit}`;
    if (!this.categoryCache[cacheKey] || forceRefresh) {
      this.categoryCache[cacheKey] = this.http
        .get(`${this.apiUrl}/category/public/${storeSlug}?page=${page}&limit=${limit}`)
        .pipe(shareReplay(1));
    }
    return this.categoryCache[cacheKey];
  }

  /** 🔹 Subir imagen de categoría */
  uploadCategoryImage(categoryId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post(`${this.apiUrl}/category/${categoryId}/upload-image`, formData)
      .pipe(tap(() => this.clearCache())); // limpiar para que actualice imagen
  }

  /** 🔹 Limpiar cache (todo o por tienda específica) */
  clearCache(storeSlug?: string): void {
    if (storeSlug) {
      Object.keys(this.categoryCache).forEach((key) => {
        if (key.startsWith(storeSlug)) delete this.categoryCache[key];
      });
    } else {
      this.categoryCache = {};
    }
  }
}
