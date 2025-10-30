import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { AppComponent } from '../../app.component';
import { TabViewModule } from "primeng/tabview"; // ✅ Importamos AppComponent
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    CartDrawerComponent,
     ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextareaModule,
    CarouselModule,
    TabViewModule,
    DropdownModule,
    InputNumberModule
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
  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService,
    public cartService: CartService,
    private elRef: ElementRef<HTMLElement>,
    private storeState: StoreStateService,
    private fb: FormBuilder,
    private appComponent: AppComponent // ✅ agregado
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadProduct(id);

     // 🧩 Inicializamos el formulario reactivo
    this.form = this.fb.group({
      variant: [''],
      quantity: [1],
      image: ['']
    });
  }

  /** ===============================
   * 🔹 Cargar producto y colores
   * =============================== */
 loadProduct(id: string) {
    this.publicStoreService.getProductById(id).subscribe({
      next: (res) => {
        this.product = res;
        this.slug = res.store.link_tienda;
        this.storeState.setStore(res.store);

        // Asignar primera imagen
        const firstImage = this.product.imagen_url?.[0] || 'https://placehold.co/600x600';
        this.form.patchValue({ image: firstImage });
      },
      error: (err) => console.error('Error cargando producto:', err),
    });
  }

   /** ===============================
   * 🔹 Miniaturas
   * =============================== */
  selectImage(img: string) {
    this.form.patchValue({ image: img });
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

  // Obtenemos la cantidad seleccionada desde el formulario
  const cantidad = this.form.get('quantity')?.value || 1;

  // Obtenemos la variante (si existe)
  const variantId = this.form.get('variant')?.value || null;

  // ✅ Construimos el payload según haya o no variante
  const payload: any = {
    productId: this.product.id_producto,
    cantidad,
  };

  if (variantId) payload.variantId = variantId;

  this.cartService
    .add(this.slug, payload)
    .subscribe({
      next: (c) => {
        this.cart = c;
        this.cartOpen = true;
      },
      error: (err) => console.error('Error agregando producto:', err),
    });
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
