import { Component, OnInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CartItem, CartResponse, CartService } from '../../../shared/services/public_services/cart.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WhatsAppService } from '../../../shared/services/public_services/whatsapp.service';
import { PaymentsService } from '../../../shared/services/public_services/payments.service';
import { environment } from '../../../../environments/environment';

// primeng
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';

import { PublicStoreService } from '../../../shared/services/public_services/publicstore.service';
import { Store } from '../../../shared/models/store.model';
import { StoreStateService } from '../../../shared/services/private_services/store-state.service'; // ✅ agregado

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
    InputTextModule,
    InputTextareaModule,
    RadioButtonModule,
    ButtonModule,
  ],
  templateUrl: './checkout-data.component.html',
  styleUrl: './checkout-data.component.scss',
})
export class CheckoutDataComponent implements OnInit {
  form!: FormGroup;
  items: CartItem[] = [];
  cart?: CartResponse;
  slug!: string;

  store: Store | null = null;
  deliveryFee = 5000;
  loading = false;
  usarTarjetaDirecta = false;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private route: ActivatedRoute,
    private wa: WhatsAppService,
    private payments: PaymentsService,
    private publicStoreService: PublicStoreService,
    private elRef: ElementRef<HTMLElement>,
    private storeState: StoreStateService // ✅ agregado
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;

    // ✅ 1. Obtener carrito
    this.cartService.getCart(this.slug).subscribe((c) => {
      this.cart = c;
      this.items = c.items;
    });

    // ✅ 2. Obtener la tienda (store)
    this.publicStoreService.getStoreBySlug(this.slug).subscribe({
      next: (s) => {
        this.store = s;
        this.storeState.setStore(s); // ✅ guardarlo globalmente

        // 🎨 Aplicar colores del backend
        const primary = s.primary_color || '#ff4081';
        const secondary = s.secondary_color || '#00bfa5';
        const bg = s.background_color === 'dark' ? '#202123' : s.background_color || '#ffffff';
        const text = s.background_color === 'dark' ? '#f5f5f5' : '#111827';
        const surface = s.background_color === 'dark' ? '#2a2b32' : '#f9fafb';

        // Aplicar al host del componente
        const host = this.elRef.nativeElement;
        host.style.setProperty('--primary', primary);
        host.style.setProperty('--secondary', secondary);
        host.style.setProperty('--bg', bg);
        host.style.setProperty('--text', text);
        host.style.setProperty('--surface', surface);

        // Aplicar también al documento global
        const root = document.documentElement;
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--secondary', secondary);
        root.style.setProperty('--bg', bg);
        root.style.setProperty('--text', text);
      },
      error: (err) => console.error('Error cargando tienda:', err),
    });

    // ✅ 3. Configurar formulario (tu código original)
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerWhatsapp: ['', Validators.required],
      deliveryMethod: ['delivery', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      address: [''],
      city: [''],
      province: [''],
      postalCode: [''],
      scheduleDate: [''],
      scheduleTime: [''],
      paymentMethod: ['Efectivo'],
      notes: [''],
    });

    // ✅ 4. Refrescar carrito y aplicar estilos locales
    this.cartService.getCart(this.slug).subscribe((c) => {
      this.cart = c;
      this.items = c.items;

      const el = this.elRef.nativeElement;
      if (el && c.store) {
        el.style.setProperty('--primary', c.store.primary_color || '#ff4081');
        el.style.setProperty('--secondary', c.store.secondary_color || '#00bfa5');
        el.style.setProperty(
          '--bg',
          c.store.background_color === 'dark' ? '#202123' : '#ffffff'
        );
        el.style.setProperty(
          '--text',
          c.store.background_color === 'dark' ? '#f5f5f5' : '#111827'
        );
        el.style.setProperty(
          '--surface',
          c.store.background_color === 'dark' ? '#2a2b32' : '#f9fafb'
        );
      }
    });
  }

  // ========================
  // 💰 Getters de totales
  // ========================
  get subtotal() {
    return this.items.reduce((acc, it) => acc + it.subtotal, 0);
  }

  get envio() {
    return this.form.value.deliveryMethod === 'delivery' ? this.deliveryFee : 0;
  }

  get total() {
    return this.subtotal + this.envio;
  }

  // ========================
  // 🛒 Métodos de carrito
  // ========================
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

  // ========================
  // 💳 Métodos de pago
  // ========================
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

  private async payWithMercadoPago() {
    if (!this.cart?.cartId) throw new Error('Carrito no encontrado');
    const mpItems = this.toMPItems();

    await this.payments.createPreferenceAndRedirect(mpItems, this.cart.cartId, this.form.value.customerEmail);
  }

  // ========================
  // 📦 Finalizar pedido
  // ========================
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

    const dto = {
      customerName: this.form.value.customerName,
      customerPhone: this.form.value.customerWhatsapp,
      customerEmail: this.form.value.customerEmail,
      direccion_envio:
        this.form.value.deliveryMethod === 'delivery'
          ? this.form.value.address
          : undefined,
      paymentMethod:
        this.form.value.paymentMethod.toUpperCase() === 'EFECTIVO'
          ? 'EFECTIVO'
          : 'MERCADOPAGO',
    };

    this.loading = true;

    this.cartService.checkout(this.slug, dto).subscribe({
      next: async (res: any) => {
        console.log('Orden creada', res);

        if (dto.paymentMethod === 'MERCADOPAGO') {
          if (this.usarTarjetaDirecta) {
            const token = "ACA_EL_TOKEN_DEL_BRICK";
            await this.payWithCard(token);
          } else {
            const redirectUrl =
              !environment.production && res.sandbox_init_point
                ? res.sandbox_init_point
                : res.init_point;
            if (redirectUrl) {
              window.location.href = redirectUrl;
            } else {
              alert('No se pudo iniciar el pago con Mercado Pago');
            }
          }
        } else {
          alert(`Tu pedido ${res.orderCode} fue generado correctamente`);
          if ('whatsappLink' in res && res.whatsappLink) {
            window.open(res.whatsappLink, '_blank');
          }
        }

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Error al generar pedido');
        this.loading = false;
      },
    });
  }

  private async payWithCard(token: string) {
    const body = {
      token,
      amount: this.total,
      payer_email: this.form.value.customerEmail as string,
      external_reference: this.cart?.cartId ?? undefined,
      installments: 1,
    };

    try {
      const res = await this.payments.payWithCard(body);
      console.log("Resultado del pago:", res);

      if (res.status === "approved") {
        alert("✅ Pago aprobado");
      } else {
        alert("⏳ Estado del pago: " + res.status);
      }
    } catch (err: any) {
      console.error("Error en pago:", err);
      alert("❌ Error al procesar el pago");
    }
  }
}
