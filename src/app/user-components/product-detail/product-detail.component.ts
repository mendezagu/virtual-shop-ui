import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
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
import { log } from 'node:console';

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckbox,
    CartDrawerComponent,
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
    public cartService: CartService
  ) {}

ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id')!; // ✅ viene de /producto/:id
  this.loadProduct(id);
}

loadProduct(id: string) {
  this.publicStoreService.getProductById(id).subscribe({
    next: (res) => {
      this.product = res;
      console.log(res, 'RESPONNNNSE')
      this.slug = res.store.link_tienda; // ✅ ahora tienes el slug real del backend
    },
    error: (err) => console.error('Error cargando producto:', err)
  });
}


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
          //observaciones: this.observaciones || null, // 👈 se envía la nota
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
        //observaciones: this.observaciones || null, // 👈 se envía la nota
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

  // 👇 helpers que usará el template
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
