import {
  Component,
  OnInit,
  ElementRef,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterModule } from '@angular/router';

import {
  CartItem,
  CartResponse,
  CartService,
} from '../../../shared/services/public_services/cart.service';
import { WhatsAppService } from '../../../shared/services/public_services/whatsapp.service';
import { PaymentsService } from '../../../shared/services/public_services/payments.service';
import { environment } from '../../../../environments/environment';

import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';

import { PublicStoreService } from '../../../shared/services/public_services/publicstore.service';
import { Store } from '../../../shared/models/store.model';
import { StoreStateService } from '../../../shared/services/private_services/store-state.service';

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
  styleUrls: ['./checkout-data.component.scss'],
})
export class CheckoutDataComponent implements OnInit, AfterViewInit {
  mp: any;
  cardBrickController: any;
  walletBrickController: any;

  showMPModal = false;
activeBrick: 'card' | 'wallet' | null = null;

  form!: FormGroup;
  items: CartItem[] = [];
  cart?: CartResponse;
  slug!: string;

  store: Store | null = null;
  deliveryFee = 5000;
  loading = false;
  usarTarjetaDirecta = false;

  // Coordenadas de la tienda
  storeLat: number | null = null;
  storeLon: number | null = null;

  // Coordenadas del buyer
  buyerLat: number | null = null;
  buyerLon: number | null = null;

  // Leaflet
  map: any = null;
  userMarker: any = null;
  storeMarker: any = null;
  routeLine: any = null;

  shippingResult: {
    distanceKm: number;
    totalCost: number;
    pricePerKm: number;
  } | null = null;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private route: ActivatedRoute,
    private wa: WhatsAppService,
    private payments: PaymentsService,
    private publicStoreService: PublicStoreService,
    private elRef: ElementRef<HTMLElement>,
    private storeState: StoreStateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;

    // 1️⃣ Obtener carrito
    this.cartService.getCart(this.slug).subscribe((c) => {
      this.cart = c;
      this.items = c.items;
    });

    // 2️⃣ Obtener tienda
    this.publicStoreService.getStoreBySlug(this.slug).subscribe({
      next: (s) => {
        this.store = s;
        this.storeState.setStore(s);

        this.storeLat = s.latitud || null;
        this.storeLon = s.longitud || null;

        // 🎨 Colores del tema
        const primary = s.primary_color || '#ff4081';
        const secondary = s.secondary_color || '#00bfa5';
        const bg =
          s.background_color === 'dark'
            ? '#202123'
            : s.background_color || '#ffffff';
        const text = s.background_color === 'dark' ? '#f5f5f5' : '#111827';
        const surface = s.background_color === 'dark' ? '#2a2b32' : '#f9fafb';

        const host = this.elRef.nativeElement;
        host.style.setProperty('--primary', primary);
        host.style.setProperty('--secondary', secondary);
        host.style.setProperty('--bg', bg);
        host.style.setProperty('--text', text);
        host.style.setProperty('--surface', surface);

        const root = document.documentElement;
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--secondary', secondary);
        root.style.setProperty('--bg', bg);
        root.style.setProperty('--text', text);

        // 🗺️ Iniciar mapa
        if (isPlatformBrowser(this.platformId) && this.store) {
          setTimeout(() => {
            const address = `${this.store?.direccion || ''}, ${this.store?.ciudad || ''}, ${this.store?.provincia || ''}`;

            if (address.trim() !== ', ,') {
              this.initMap(address);
            }
          }, 500);
        }
      },
      error: (err) => console.error('Error cargando tienda:', err),
    });

    // 3️⃣ Formulario
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
  }

  // =====================================================
  // MERCADO PAGO BRICKS
  // =====================================================

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.mp = new (window as any).MercadoPago(environment.mpPublicKey, {
        locale: 'es-AR',
      });

      setTimeout(() => {
        this.initCardBrick();
        this.initWalletBrick();
      }, 300);
    }
  }

  async initCardBrick() {
    if (!this.mp) return;

    const intent = await this.payments.createBrickPaymentIntent(
      this.total,
      this.form.value.customerEmail,
      this.cart?.cartId ?? undefined
    );

    const bricksBuilder = this.mp.bricks();

    this.cardBrickController = await bricksBuilder.create(
      'cardPayment',
      'cardPaymentBrick_container',
      {
        initialization: {
          amount: this.total,
          payer: {
            email: this.form.value.customerEmail,
          },
        },
        callbacks: {
          onSubmit: async (cardData: any) => {
            const token = cardData.token;

            const res = await this.payments.confirmBrickCardPayment(
              token,
              this.total,
              this.form.value.customerEmail,
              this.cart?.cartId ?? undefined
            );

            if (res.status === 'approved') {
              alert('✅ Pago aprobado');
            } else {
              alert('⏳ Estado: ' + res.status);
            }
          },
          onError: (error: any) => console.error('Error Brick:', error),
        },
      }
    );
  }

  async initWalletBrick() {
    if (!this.mp || !this.cart) return;

    console.log('Wallet: creando preferencia...');

    const pref = await this.payments.createWalletPreference(
      this.total,
      this.cart.cartId ?? undefined,
      this.form.value.customerEmail
    );

    console.log('Wallet: preference id', pref.preference_id);

    const bricksBuilder = this.mp.bricks();

    try {
      this.walletBrickController = await bricksBuilder.create(
        'wallet',
        'walletBrick_container',
        {
          initialization: {
            preferenceId: pref.preference_id,
            redirectMode: 'self',
            redirectOnSuccess: true,
            redirectOnError: true,
            redirectOnPending: true,
          },
          callbacks: {
            onReady: () => console.log('Wallet READY'),
            onError: (err: any) => console.error('Wallet ERROR', err),
          },
        }
      );
    } catch (e) {
      console.error('Error creando Wallet Brick:', e);
    }
  }

  // =====================================================
  // MAPA Y ENVÍOS
  // =====================================================

  async initMap(address: string) {
    const { isPlatformBrowser } = await import('@angular/common');
    if (!isPlatformBrowser(this.platformId)) return;

    const L = await import('leaflet');

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });

    this.map = L.map('storeMap').setView([-31.4201, -64.1888], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    const storeData = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    ).then((res) => res.json());

    if (storeData.length === 0) return;

    const lat = parseFloat(storeData[0].lat);
    const lon = parseFloat(storeData[0].lon);

    this.storeLat = lat;
    this.storeLon = lon;

    this.storeMarker = L.marker([lat, lon])
      .addTo(this.map)
      .bindPopup(`<b>${this.store?.nombre_tienda}</b><br>${address}`)
      .openPopup();

    this.map.setView([lat, lon], 14);

    this.storeMarker.on('click', () => {
      window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
    });

    const mapContainer = document.getElementById('storeMap');
    if (mapContainer) {
      const button = document.createElement('button');
      button.innerHTML = `<i class="pi pi-map-marker mr-1"></i> Ver en Google Maps`;
      button.className =
        'absolute bottom-4 right-4 z-[999] flex items-center gap-2 bg-[#008060] hover:bg-[#00684a] text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition-all duration-200';

      button.onclick = () =>
        window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');

      mapContainer.appendChild(button);
    }
  }

  async calculateShippingCost(data: {
    latA: number;
    lonA: number;
    latB: number;
    lonB: number;
  }) {
    if (!this.store?.id_tienda) return;

    const url = 'http://localhost:3000/api/shipping/calculate';
    const body = { storeId: this.store.id_tienda, ...data };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Error en cálculo de envío');

      const result = await res.json();
      this.shippingResult = {
        distanceKm: result.distanceKm,
        totalCost: result.totalCost,
        pricePerKm: result.pricePerKm,
      };
    } catch (err) {
      console.error('Error calculando envío:', err);
    }
  }

  // =====================================================
  // TOTALES
  // =====================================================

  get subtotal() {
    return this.items.reduce((acc, it) => acc + it.subtotal, 0);
  }

  get envio() {
    if (this.form.value.deliveryMethod !== 'delivery') return 0;
    return this.shippingResult?.totalCost || this.deliveryFee;
  }

  get total() {
    return this.subtotal + this.envio;
  }

  // =====================================================
  // CARRITO
  // =====================================================

  increment(item: CartItem) {
    this.cartService.update(this.slug, item.id, item.cantidad + 1).subscribe();
  }

  decrement(item: CartItem) {
    if (item.cantidad > 1) {
      this.cartService
        .update(this.slug, item.id, item.cantidad - 1)
        .subscribe();
    }
  }

  remove(itemId: string) {
    this.cartService.remove(this.slug, itemId).subscribe();
  }

  // =====================================================
  // PAGOS
  // =====================================================

  private toMPItems() {
    return this.items.map((it) => {
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

    await this.payments.createPreferenceAndRedirect(
      mpItems,
      this.cart.cartId,
      this.form.value.customerEmail
    );
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
      console.log('Resultado del pago:', res);

      if (res.status === 'approved') {
        alert('✅ Pago aprobado');
      } else {
        alert('⏳ Estado del pago: ' + res.status);
      }
    } catch (err: any) {
      console.error('Error en pago:', err);
      alert('❌ Error al procesar el pago');
    }
  }

  // =====================================================
  // FINALIZAR PEDIDO
  // =====================================================

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
            return;
          }

          await this.payWithMercadoPago();
          return;
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
}
