import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { Producto } from '../../models/product.model';
import { PaginatedResponse, ProductService } from './product.service';

@Injectable({ providedIn: 'root' })
export class ProductStateService {
  private productsSubject = new BehaviorSubject<PaginatedResponse<Producto> | null>(null);
  products$ = this.productsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<any[] | null>(null);
  categories$ = this.categoriesSubject.asObservable();

  private storeId: string | null = null;
  private storeSlug: string | null = null;

  private page = 1;
  private limit = 10;
  private searchTerm = '';

  // 🔹 Nuevos filtros
  private sort = '';
  private condition = '';
  private available = '';
  private unidad = '';
  private grupo = '';
  private minPrice = '';
  private maxPrice = '';

  constructor(private productService: ProductService) {}

  init(storeId: string, storeSlug: string) {
    this.storeId = storeId;
    this.storeSlug = storeSlug;
    this.loadProducts(true);
    if (!this.categoriesSubject.value) this.loadCategories();
  }

  loadProducts(forceRefresh = false) {
    if (!this.storeId) return;

    this.productService
      .getProductsByStore(
        this.storeId,
        this.page,
        this.limit,
        this.searchTerm,
        this.sort,
        this.condition,
        this.available,
        this.unidad,
        this.grupo,
        this.minPrice,
        this.maxPrice,
        forceRefresh
      )
      .subscribe({
        next: (res) => this.productsSubject.next(res),
        error: () => this.productsSubject.next(null),
      });
  }

  setPage(page: number) {
    this.page = page;
    this.loadProducts(true);
  }

  setLimit(limit: number) {
    this.limit = limit;
    this.page = 1;
    this.loadProducts(true);
  }

  setSearch(term: string) {
    this.searchTerm = term;
    this.loadProducts();
  }

  // 🟢 Nuevos setters
  setSort(sort: string) {
    this.sort = sort;
    this.loadProducts(true);
  }

  setCondition(condition: string) {
    this.condition = condition;
    this.loadProducts(true);
  }

  setAvailable(value: string) {
    this.available = value;
    this.loadProducts(true);
  }

  setUnidad(value: string) {
    this.unidad = value;
    this.loadProducts(true);
  }

  setGrupo(value: string) {
    this.grupo = value;
    this.loadProducts(true);
  }

  setPriceRange(min: string, max: string) {
    this.minPrice = min;
    this.maxPrice = max;
    this.loadProducts(true);
  }

  loadCategories(forceRefresh = false) {
    if (!this.storeSlug) return;
    this.productService.getCategories(this.storeSlug, forceRefresh).subscribe({
      next: (res) => this.categoriesSubject.next(res?.data ?? []),
      error: () => this.categoriesSubject.next(null),
    });
  }

  deleteProduct(id_producto: string) {
    return this.productService.deleteProduct(id_producto).pipe(tap(() => this.loadProducts(true)));   
  }
}
