import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Producto } from '../../models/product.model';
import { Observable } from 'rxjs';

// 👇 DTO de creación (match con CreateProductDto del backend)
export interface CreateProductPayload {
  nombre_producto: string;
  categoria?: string;
  grupo?: string;
  descripcion?: string;
  stock?: number;                 // usado si NO hay variantes
  precio?: number;                // usado si NO hay variantes
  imagen_url?: string[];
  presentacion_multiple?: boolean;
  disponible?: boolean;
  variants?: {                    // usado si presentacion_multiple = true
    nombre: string;
    stock: number;
    precio: number;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  // Método para crear un producto en una tienda específica
  createProduct(id_tienda: string, producto: Producto): Observable<any> {
    const url = `${this.baseUrl}/${id_tienda}`;
    return this.http.post(url, producto);
  }

   // 👇 Nuevo método
  getCategories(storeSlug?: string): Observable<any> {
    if (storeSlug) {
      // categorías públicas por tienda
      return this.http.get(`${this.baseUrl}/public/store/${storeSlug}/categories`);
    }
    // si no pasás slug, que devuelva todas las categorías del usuario (admin)
    return this.http.get(`${this.baseUrl}/categories`);
  }

  // Obtener productos de una tienda
 // (el resto de métodos puede seguir igual)
  getProductsByStore(
    id_tienda: string,
    page = 1,
    limit = 5,
    searchTerm: string = ''
  ): Observable<PaginatedResponse<Producto>> {
    let url = `${this.baseUrl}/shop/${id_tienda}?page=${page}&limit=${limit}`;
    if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm)}`;
    return this.http.get<PaginatedResponse<Producto>>(url);
  }

  updateProduct(id_producto: string, producto: Partial<CreateProductPayload>): Observable<any> {
    const url = `${this.baseUrl}/${id_producto}`;
    return this.http.put(url, producto);
  }

  updateCategory(id: string, name: string) {
  return this.http.put(`/api/products/category/${id}`, { name });
}

deleteProduct(id_producto: string): Observable<any> {
  const url = `${this.baseUrl}/${id_producto}`;
  return this.http.delete(url);
}
}
