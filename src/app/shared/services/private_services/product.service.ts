import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { Producto } from '../../models/product.model';
import { environment } from '../../../../environments/environment';

// DTOs
export interface CreateProductPayload {
  nombre_producto: string;
  categoria?: string;
  grupo?: string;
  descripcion?: string;
  stock?: number;
  precio?: number;
  imagen_url?: string[];
  presentacion_multiple?: boolean;
  disponible?: boolean;
  variants?: {
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

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  

  /** Cache de productos: clave = id_tienda + page + limit + search */
  private productCache: Record<string, Observable<PaginatedResponse<Producto>>> = {};

  /** Cache de categorías por tienda (slug) */
  private categoryCache: Record<string, Observable<any>> = {};

  constructor(private http: HttpClient) {}

  /** 🟢 Crear producto y limpiar cache */
  createProduct(id_tienda: string, producto: Producto): Observable<any> {
    const url = `${this.apiUrl}/${id_tienda}`;
    return this.http.post(url, producto).pipe(tap(() => this.clearCache(id_tienda)));
  }

  /** 🟡 Obtener categorías (con cache por tienda pública) */
  getCategories(storeSlug?: string, forceRefresh = false): Observable<any> {
    if (!storeSlug) return this.http.get(`${this.apiUrl}/categories`);

    if (!this.categoryCache[storeSlug] || forceRefresh) {
      this.categoryCache[storeSlug] = this.http
        .get(`${this.apiUrl}/public/store/${storeSlug}/categories`)
        .pipe(shareReplay(1));
    }

    return this.categoryCache[storeSlug];
  }

  /** 🟣 Obtener productos de una tienda (cacheados por página y búsqueda) */
getProductsByStore(
  id_tienda: string,
  page = 1,
  limit = 10,
  searchTerm = '',
  sort = '',
  condition = '',
  available = '',
  unidad = '',
  grupo = '',
  minPrice = '',
  maxPrice = '',
  forceRefresh = false
): Observable<PaginatedResponse<Producto>> {
  const key = `${id_tienda}-p${page}-l${limit}-s${searchTerm}-${sort}-${condition}-${available}-${unidad}-${grupo}-${minPrice}-${maxPrice}`;

  if (!this.productCache[key] || forceRefresh) {
    let url = `${this.apiUrl}/shop/${id_tienda}?page=${page}&limit=${limit}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (sort) url += `&sort=${sort}`;
    if (condition) url += `&condition=${condition}`;
    if (available) url += `&available=${available}`;
    if (unidad) url += `&unidad=${unidad}`;
    if (grupo) url += `&grupo=${encodeURIComponent(grupo)}`;
    if (minPrice) url += `&minPrice=${minPrice}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;

    this.productCache[key] = this.http
      .get<PaginatedResponse<Producto>>(url)
      .pipe(shareReplay(1));
  }

  return this.productCache[key];
}



  /** 🔵 Actualizar producto y limpiar cache */
  updateProduct(
    id_producto: string,
    producto: Partial<CreateProductPayload>
  ): Observable<any> {
    const url = `${this.apiUrl}/${id_producto}`;
    return this.http.put(url, producto).pipe(tap(() => this.clearCache()));
  }

  /** 🔴 Eliminar producto y limpiar cache */
  deleteProduct(id_producto: string): Observable<any> {
    const url = `${this.apiUrl}/${id_producto}`;
    return this.http.delete(url).pipe(tap(() => this.clearCache()));
  }

  /** 🧹 Limpia cache completa o solo de una tienda específica */
  clearCache(storeId?: string): void {
    if (storeId) {
      Object.keys(this.productCache).forEach((key) => {
        if (key.startsWith(storeId)) delete this.productCache[key];
      });
    } else {
      this.productCache = {};
    }

    // limpiar categorías también si hay cambios de productos
    this.categoryCache = {};
  }
}
