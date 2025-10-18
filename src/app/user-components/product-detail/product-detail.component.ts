import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { PublicStoreService } from '../../shared/services/public_services/publicstore.service';
import { CartDrawerComponent } from '../../components/cart-drawer/cart-drawer.component';
import {
  CartResponse,
  CartService,
} from '../../shared/services/public_services/cart.service';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CarouselModule } from 'primeng/carousel';
import { StoreStateService } from '../../shared/services/private_services/store-state.service';
import { AppComponent } from '../../app.component'; // ✅ Importamos AppComponent

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    CartDrawerComponent,
    ButtonModule,
    CheckboxModule,
    InputTextareaModule,
    CarouselModule,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  product: any;
  slug!: string;
  qty: Record<string, number> = {};
  selectedVariants: Set<string> = new Set();
  observaciones = '';
  cartOpen = false;
  cart?: CartResponse;

  constructor(
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService,
    public cartService: CartService,
    private elRef: ElementRef<HTMLElement>,
    private storeState: StoreStateService,
    private appComponent: AppComponent // ✅ agregado
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadProduct(id);
  }

  /** ===============================
   * 🔹 Cargar producto y colores
   * =============================== */
  loadProduct(id: string) {
    this.publicStoreService.getProductById(id).subscribe({
      next: (res) => {
        this.product = res;
        this.slug = res.store.link_tienda;

        // ✅ Guardar la tienda globalmente
        this.storeState.setStore(res.store);

        // ✅ Aplicar los colores globalmente (AppComponent controla sidebar y tema)
        // Llamar de forma segura usando una type assertion a 'any' para evitar el error
        // de acceso a un miembro privado en tiempo de compilación y verificar en tiempo de ejecución.
        const appComp: any = this.appComponent as any;
        if (typeof appComp.applyBuyerTheme === 'function') {
          appComp.applyBuyerTheme(res.store);
        }

        // 🎨 Aplicar también al host localmente (para fallback)
        const store = res.store;
        const secondary = store?.secondary_color || '#00bfa5';
        const primary = store?.primary_color || '#ff4081';
        const bg =
          store?.background_color === 'dark'
            ? '#202123'
            : store?.background_color || '#ffffff';
        const text =
          store?.background_color === 'dark' ? '#f5f5f5' : '#111827';
        const surface =
          store?.background_color === 'dark' ? '#2a2b32' : '#f9fafb';

        const host = this.elRef.nativeElement;
        host.style.setProperty('--primary', primary);
        host.style.setProperty('--secondary', secondary);
        host.style.setProperty('--bg', bg);
        host.style.setProperty('--text', text);
        host.style.setProperty('--surface', surface);

        console.log('🎨 Colores aplicados desde tienda:', {
          primary,
          secondary,
          bg,
          text,
        });
      },
      error: (err) => console.error('Error cargando producto:', err),
    });
  }

  /** ===============================
   * 🔹 Variantes y cantidades
   * =============================== */
  toggleVariant(id: string, checked: boolean) {
    if (checked) {
      this.selectedVariants.add(id);
      if (!this.qty[id]) this.qty[id] = 1;
    } else {
      this.selectedVariants.delete(id);
      delete this.qty[id];
    }
  }

  increment(id: string) {
    this.qty[id] = (this.qty[id] || 0) + 1;
  }

  decrement(id: string) {
    this.qty[id] = Math.max((this.qty[id] || 1) - 1, 0);
  }

  get total() {
    if (!this.product) return 0;
    if (this.product.presentacion_multiple) {
      return [...this.selectedVariants].reduce((acc, id) => {
        const v = this.product.variants.find((x: any) => x.id_variant === id);
        return acc + (this.qty[id] || 0) * (v?.precio || 0);
      }, 0);
    }
    return (this.qty['single'] || 1) * (this.product.precio || 0);
  }

  /** ===============================
   * 🔹 Carrito
   * =============================== */
  addToCart() {
    if (!this.product) return;

    if (this.product.presentacion_multiple) {
      // con variantes
      [...this.selectedVariants].forEach((id) => {
        const cantidad = this.qty[id] || 1;
        this.cartService
          .add(this.slug, {
            productId: this.product.id_producto,
            variantId: id,
            cantidad,
          })
          .subscribe({
            next: (c) => {
              this.cart = c;
              this.cartOpen = true;
            },
            error: (err) => console.error('Error agregando variante:', err),
          });
      });
    } else {
      // sin variantes
      const cantidad = this.qty['single'] || 1;
      this.cartService
        .add(this.slug, {
          productId: this.product.id_producto,
          cantidad,
        })
        .subscribe({
          next: (c) => {
            this.cart = c;
            this.cartOpen = true;
          },
          error: (err) => console.error('Error agregando producto:', err),
        });
    }
  }

  onUpdateQty(ev: { itemId: string; cantidad: number }) {
    this.cartService
      .update(this.slug, ev.itemId, ev.cantidad)
      .subscribe((c) => (this.cart = c));
  }

  onRemove(itemId: string) {
    this.cartService
      .remove(this.slug, itemId)
      .subscribe((c) => (this.cart = c));
  }

  onClear() {
    this.cartService.clear(this.slug).subscribe((c) => (this.cart = c));
  }
}
