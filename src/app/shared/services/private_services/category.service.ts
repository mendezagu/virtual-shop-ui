// product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  // ✅ Crear categoría
  createCategory(shopId: string, name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/category/${shopId}`, { name });
  }

  // ✅ Actualizar categoría
  updateCategory(categoryId: string, name: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/category/${categoryId}`, { name });
  }

  // ✅ Eliminar categoría
  deleteCategory(categoryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/category/${categoryId}`);
  }

  // ✅ Obtener categorías de la tienda pública
  getCategories(storeSlug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/public/store/${storeSlug}/categories`);
  }
}
