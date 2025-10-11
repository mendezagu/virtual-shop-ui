import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../../models/product.model';
import { PaginatedResponse, ProductService } from './product.service';

@Injectable({ providedIn: 'root' })
export class ProductStateService {
  /** 🔹 Estado interno */
  private productsSubject = new BehaviorSubject<PaginatedResponse<Producto> | null>(null);
  products$ = this.productsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<any[] | null>(null);
  categories$ = this.categoriesSubject.asObservable();

  /** 🔹 Parámetros de estado */
  private storeId: string | null = null;
  private storeSlug: string | null = null;
  private page = 1;
  private limit = 10;
  private searchTerm = '';

  constructor(private productService: ProductService) {}

  /** Inicializar datos con tienda */
init(storeId: string, storeSlug: string) {
  this.storeId = storeId;
  this.storeSlug = storeSlug;

  // Solo cargar si aún no hay datos
  if (!this.productsSubject.value) {
    this.loadProducts();
  }

  if (!this.categoriesSubject.value) {
    this.loadCategories();
  }
}

  /** Obtener productos desde API y guardar en estado */
  loadProducts(forceRefresh = false) {
    if (!this.storeId) return;

    this.productService
      .getProductsByStore(this.storeId, this.page, this.limit, this.searchTerm, forceRefresh)
      .subscribe({
        next: (res) => this.productsSubject.next(res),
        error: () => this.productsSubject.next(null),
      });
  }

  /** Obtener categorías públicas de la tienda */
/** Obtener categorías públicas de la tienda */
loadCategories(forceRefresh = false) {
  if (!this.storeSlug) return;

  this.productService
    .getCategories(this.storeSlug, forceRefresh)
    .subscribe({
      next: (res) => {
        const cats = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : []; // fallback seguro
        this.categoriesSubject.next(res?.data ?? []);
      },
      error: () => this.categoriesSubject.next(null),
    });
}


  /** Cambiar página */
  setPage(page: number) {
    this.page = page;
    this.loadProducts();
  }

  /** Cambiar límite */
  setLimit(limit: number) {
    this.limit = limit;
    this.loadProducts();
  }

  /** Buscar */
  setSearch(term: string) {
    this.searchTerm = term;
    this.loadProducts();
  }

  /** Crear producto y refrescar */
  createProduct(product: Producto) {
    if (!this.storeId) return;
    this.productService.createProduct(this.storeId, product).subscribe({
      next: () => this.loadProducts(true),
    });
  }

  /** Eliminar producto y refrescar */
  deleteProduct(id_producto: string) {
    this.productService.deleteProduct(id_producto).subscribe({
      next: () => this.loadProducts(true),
    });
  }

  /** Refrescar manual */
  refresh() {
    this.loadProducts(true);
    this.loadCategories(true);
  }

  /** Limpiar estado (logout o cambio de tienda) */
  clear() {
    this.productsSubject.next(null);
    this.categoriesSubject.next(null);
    this.storeId = null;
    this.storeSlug = null;
  }
}
