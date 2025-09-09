// src/app/.../checkout-data.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CartItem, CartResponse, CartService } from '../../../shared/services/public_services/cart.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WhatsAppService } from '../../../shared/services/public_services/whatsapp.service';
import { PaymentsService } from '../../../shared/services/public_services/payments.service'; // 👉 NUEVO

@Component({
  selector: 'app-checkout-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './checkout-data.component.html',
  styleUrl: './checkout-data.component.scss',
})
export class CheckoutDataComponent implements OnInit {
  form!: FormGroup;
  items: CartItem[] = [];
  cart?: CartResponse;
  slug!: string;

  deliveryFee = 5000;
  loading = false; // 👉 NUEVO

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private route: ActivatedRoute,
    private wa: WhatsAppService,
    private payments: PaymentsService // 👉 NUEVO
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;

    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerWhatsapp: ['', Validators.required],
      deliveryMethod: ['delivery', Validators.required],
      address: [''],
      city: [''],
      province: [''],
      postalCode: [''],
      scheduleDate: [''],
      scheduleTime: [''],
      paymentMethod: ['Efectivo'], // lo dejamos como tenías (default efectivo)
      notes: [''],
    });

    this.cartService.getCart(this.slug).subscribe((c) => {
      this.cart = c;
      this.items = c.items;
    });
  }

  get subtotal() {
    return this.items.reduce((acc, it) => acc + it.subtotal, 0);
  }

  get envio() {
    return this.form.value.deliveryMethod === 'delivery' ? this.deliveryFee : 0;
  }

  get total() {
    return this.subtotal + this.envio;
  }

  increment(item: CartItem) {
    this.cartService.update(this.slug, item.id, item.cantidad + 1).subscribe();
  }

  decrement(item: CartItem) {
    if (item.cantidad > 1) {
      this.cartService.update(this.slug, item.id, item.cantidad - 1).subscribe();
    }
  }

  remove(itemId: string) {
    this.cartService.remove(this.slug, itemId).subscribe();
  }

  // 👉 NUEVO: mapear tus items a items de Mercado Pago
  private toMPItems() {
    return this.items.map(it => {
      const name = it.product?.nombre_producto || 'Producto';
      const variantName = it?.variant?.nombre ? ` - ${it.variant.nombre}` : '';
      return {
        title: name + variantName,
        quantity: it.cantidad,
        currency_id: 'ARS',
        unit_price: Number(it.precio_unit),
      };
    });
  }

  // 👉 NUEVO: flujo Mercado Pago
  private async payWithMercadoPago() {
    if (!this.cart?.cartId) throw new Error('Carrito no encontrado');
    const mpItems = this.toMPItems();
    const pref = await this.payments.createPreference(mpItems, this.cart.cartId);
    this.payments.redirectToCheckout(pref.init_point);
  }

  // Tu método original (WhatsApp) lo dejamos intacto
  placeOrder() {
    if (!this.cart?.cartId || !this.items.length) {
      alert('Tu carrito está vacío.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Completá los campos obligatorios.');
      return;
    }

    const {
      customerName,
      customerWhatsapp,
      deliveryMethod,
      address,
      city,
      province,
      postalCode,
      scheduleDate,
      scheduleTime,
      paymentMethod,
      notes,
    } = this.form.value;

    // 👉 NUEVO: si elige Mercado Pago, desviamos aquí y no seguimos a WhatsApp
    if (paymentMethod === 'Mercado Pago' || paymentMethod === 'MercadoPago') {
      this.loading = true;
      this.payWithMercadoPago()
        .catch(err => {
          console.error('No se pudo iniciar Mercado Pago', err);
          alert(err?.message || 'No se pudo iniciar el pago con Mercado Pago');
        })
        .finally(() => (this.loading = false));
      return;
    }

    // === Flujo original: WhatsApp (Efectivo) ===
    const payload = {
      cartId: this.cart.cartId,
      customerName,
      customerWhatsapp,
      address: deliveryMethod === 'delivery' ? address : undefined,
      city: deliveryMethod === 'delivery' ? city : undefined,
      province: deliveryMethod === 'delivery' ? province : undefined,
      postalCode: deliveryMethod === 'delivery' ? postalCode : undefined,
      deliveryMethod: deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup',
      scheduleDate: scheduleDate || undefined,
      scheduleTime: scheduleTime || undefined,
      paymentMethod: paymentMethod || undefined,
      deliveryFee: this.envio.toString(),
      notes: notes || undefined,
    } as const;

    this.wa.createLink(this.slug, payload).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: (err) => {
        console.error('No se pudo generar el link de WhatsApp', err);
        alert(err?.error?.message || 'No se pudo generar el link de WhatsApp');
      },
    });
  }
}
