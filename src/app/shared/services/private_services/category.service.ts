// product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ✅ Crear categoría

  createCategory(
    storeId: string,
    name: string,
    parentId?: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/category`, {
      storeId,
      name,
      parentId,
    });
  }

  // ✅ Actualizar categoría (PATCH en backend)
  updateCategory(categoryId: string, name: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/category/${categoryId}`, { name });
  }

  // ✅ Eliminar categoría (DELETE en backend)
  deleteCategory(categoryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/category/${categoryId}`);
  }

  // ✅ Obtener categorías de la tienda pública

  // ✅ Obtener categorías públicas con paginación
  getCategories(storeSlug: string, page = 1, limit = 10): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/category/public/${storeSlug}?page=${page}&limit=${limit}`
    );
  }

  // ✅ Subir imagen de categoría
  uploadCategoryImage(categoryId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.apiUrl}/category/${categoryId}/upload-image`,
      formData
    );
  }
}
