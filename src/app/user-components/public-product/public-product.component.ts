import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PublicStoreService } from '../../shared/services/public_services/publicstore.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { CartResponse, CartService } from '../../shared/services/public_services/cart.service';
import { VariantQtyDialog } from '../../shared/components/variant-qty.dialog';
import { CartDrawerComponent } from "../../components/cart-drawer/cart-drawer.component";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StoreStateService } from '../../shared/services/private_services/store-state.service';

@Component({
  selector: 'app-public-product',
  standalone: true,
  imports: [CommonModule, MatButtonModule, CartDrawerComponent, MatDialogModule, RouterModule],
  templateUrl: './public-product.component.html',
  styleUrl: './public-product.component.scss'
})
export class PublicProductComponent {
  slug!: string;

  products: any[] = [];
  isLoading = true;
  hasError = false;

  page = 1;
  limit = 12;
  total = 0;

  // carrito
  cartOpen = false;
  cart?: CartResponse;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService,
    private cartService: CartService,
    private dialog: MatDialog,
    private storeState: StoreStateService // ✅ agregado
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.loadStoreAndProducts(); // ✅ nuevo método que carga el store y luego productos
  }

  /** ================================
   * 🔹 Cargar tienda y productos
   * ================================ */
  private loadStoreAndProducts() {
    this.isLoading = true;
    this.hasError = false;

    this.publicStoreService.getStoreBySlug(this.slug).subscribe({
      next: (store) => {
        // ✅ Guardar globalmente para toda la app (Sidebar, colores, etc.)
        this.storeState.setStore(store);

        // ✅ Aplicar colores inmediatamente
        const root = document.documentElement;
        root.style.setProperty('--primary', store.primary_color || '#7e22ce');
        root.style.setProperty('--secondary', store.secondary_color || '#ec4899');
        root.style.setProperty(
          '--bg',
          store.background_color === 'dark'
            ? '#202123'
            : store.background_color || '#ffffff'
        );
        root.style.setProperty(
          '--text',
          store.background_color === 'dark' ? '#f5f5f5' : '#111827'
        );

        // ✅ Ahora sí cargar los productos
        this.loadProducts(this.page, this.limit, true);

        // ✅ Inicializar carrito si estamos en navegador
        if (isPlatformBrowser(this.platformId)) {
          this.cartService.getCart(this.slug).subscribe(c => (this.cart = c));
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando tienda:', err);
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  /** ================================
   * 🔹 Cargar productos
   * ================================ */
  loadProducts(page: number = 1, limit: number = this.limit, reset = false) {
    if (reset) {
      this.products = [];
      this.page = 1;
    }
    this.isLoading = true;
    this.hasError = false;

    this.publicStoreService.getProductsBySlug(this.slug, page, limit).subscribe({
      next: (res) => {
        this.total = res?.meta?.total ?? 0;
        const data = res?.data ?? [];
        this.products = reset ? data : [...this.products, ...data];
        this.page = page;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  /** ================================
   * 🔹 Paginado
   * ================================ */
  loadMore() {
    if (this.products.length >= this.total) return;
    this.loadProducts(this.page + 1, this.limit);
  }

  hasMore() {
    return this.products.length < this.total;
  }

  /** ================================
   * 🔹 Carrito
   * ================================ */
  fetchCart() {
    this.cartService.getCart(this.slug).subscribe((c) => (this.cart = c));
  }

  openCart() {
    this.cartOpen = true;
    this.fetchCart();
  }

  addToCart(product: any) {
    // con variantes: dialog para elegir
    if (product.presentacion_multiple && product.variants?.length) {
      const ref = this.dialog.open(VariantQtyDialog, { data: { variants: product.variants } });
      ref.afterClosed().subscribe((res: { variantId: string; cantidad: number } | undefined) => {
        if (!res) return;
        this.cartService
          .add(this.slug, {
            productId: product.id_producto,
            variantId: res.variantId,
            cantidad: res.cantidad,
          })
          .subscribe((c) => {
            this.cart = c;
            this.cartOpen = true;
          });
      });
      return;
    }

    // sin variantes: agrega 1 por defecto
    this.cartService
      .add(this.slug, { productId: product.id_producto, cantidad: 1 })
      .subscribe((c) => {
        this.cart = c;
        this.cartOpen = true;
      });
  }

  updateQty(ev: { itemId: string; cantidad: number }) {
    if (ev.cantidad < 1) return;
    this.cartService.update(this.slug, ev.itemId, ev.cantidad).subscribe((c) => (this.cart = c));
  }

  removeItem(itemId: string) {
    this.cartService.remove(this.slug, itemId).subscribe((c) => (this.cart = c));
  }

  clearCart() {
    this.cartService.clear(this.slug).subscribe((c) => (this.cart = c));
  }

  /** ================================
   * 🔹 Getters del carrito
   * ================================ */
  get cartItems() {
    return this.cart?.items ?? [];
  }
  get cartTotal() {
    return this.cart?.total ?? 0;
  }
  get cartCount() {
    return this.cartItems.reduce((acc, it) => acc + it.cantidad, 0);
  }
}
