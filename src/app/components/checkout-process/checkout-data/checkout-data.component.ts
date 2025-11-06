// src/app/components/checkout-process/checkout-data/checkout-data.component.ts
import { Component, OnInit, AfterViewInit, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';

// Servicios y modelos
import { CartService, CartItem, CartResponse } from '../../../shared/services/public_services/cart.service';
import { PublicStoreService } from '../../../shared/services/public_services/publicstore.service';
import { StoreStateService } from '../../../shared/services/private_services/store-state.service';
import { Store } from '../../../shared/models/store.model';
import { ShippingService } from '../../../shared/services/private_services/shipping.service';
import { environment } from '../../../../environments/environment';
import { ReactiveFormsModule } from '@angular/forms';




@Component({
  selector: 'app-checkout-data',
  standalone: true,
  imports: [CommonModule, InputTextModule, InputTextareaModule, RadioButtonModule, ButtonModule, ReactiveFormsModule ],
  templateUrl: './checkout-data.component.html',
  styleUrls: ['./checkout-data.component.scss'],
 
})
export class CheckoutDataComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  slug!: string;

  items: CartItem[] = [];
  cart?: CartResponse;

  store: Store | null = null;

  shippingResult: { distanceKm: number; totalCost: number; pricePerKm: number } | null = null;
  loading = false;

  // Totales
  subtotal = 0;
  envio = 0;
  total = 0;

  // Leaflet
  map: any = null;
  storeMarker: any = null;
  userMarker: any = null;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private publicStoreService: PublicStoreService,
    private storeState: StoreStateService,
    private shippingService: ShippingService,
    private route: ActivatedRoute,
    private elRef: ElementRef<HTMLElement>,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug')!;

    

    // Inicializar formulario
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerWhatsapp: ['', Validators.required],
      deliveryMethod: ['delivery', Validators.required],
      paymentMethod: ['Efectivo', Validators.required],
      address: [''],
      city: [''],
      province: [''],
      postalCode: [''],
      scheduleDate: [''],
      scheduleTime: [''],
      notes: [''],
    });

    this.form.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    this.loadCart();
    this.loadStore();
  }

  ngAfterViewInit(): void {
    // Se inicializa Leaflet en loadStore()
  }

  // =====================
  // Cargar carrito
  // =====================
  private loadCart(): void {
    this.cartService.getCart(this.slug).subscribe((c) => {
      this.cart = c;
      this.items = c.items;
      this.calculateTotals();
    });
  }

  // =====================
  // Cargar tienda
  // =====================
  private loadStore(): void {
    this.publicStoreService.getStoreBySlug(this.slug).subscribe((s: Store) => {
      this.store = s;
      this.storeState.setStore(s);

      // Inicializar mapa
      if (isPlatformBrowser(this.platformId)) {
        const address = `${s.direccion}, ${s.ciudad}, ${s.provincia}`;
        this.initMap(address);
      }

      this.getShippingData(s.id_tienda);
    });
  }


async updateMap(address: string, city: string, province: string) {
  if (typeof window === 'undefined') return; // evitar error SSR
  const L = await import('leaflet');

  const fullAddress = `${address}, ${city}, ${province}`;
  this.http.get<any>(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`)
    .subscribe((res) => {
      if (res && res.length > 0) {
        const lat = parseFloat(res[0].lat);
        const lon = parseFloat(res[0].lon);

        if (this.userMarker) {
          this.userMarker.setLatLng([lat, lon]);
        } else {
          this.userMarker = L.marker([lat, lon], {
            icon: L.icon({ iconUrl: 'assets/user-marker.png', iconSize: [25, 41] })
          }).addTo(this.map);
        }

        this.map.setView([lat, lon], 14);
      }
    });
}



 
  // =====================
// Método initMap actualizado
// =====================
async initMap(address: string) {
  if (!isPlatformBrowser(this.platformId)) return;

  const L = await import('leaflet');

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
    iconUrl: 'assets/leaflet/marker-icon.png',
    shadowUrl: 'assets/leaflet/marker-shadow.png',
  });

  // Inicializar mapa
  this.map = L.map('storeMap').setView([-31.4201, -64.1888], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(this.map);

  // Geocodificar dirección de la tienda
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  ).then((r) => r.json());

  if (res.length > 0) {
    const lat = parseFloat(res[0].lat);
    const lon = parseFloat(res[0].lon);

    // Marcador tienda
    this.storeMarker = L.marker([lat, lon]).addTo(this.map).bindPopup('Tienda').openPopup();
    this.map.setView([lat, lon], 15);

    // Marcador usuario (draggable)
    this.userMarker = L.marker([lat, lon], { draggable: true })
      .addTo(this.map)
      .bindPopup('Tu ubicación')
      .openPopup();

    // 🔹 PASO 3: Escuchar drag del marcador para recalcular envío
   this.userMarker.on('dragend', async () => {
  const pos = this.userMarker.getLatLng();

  // Reverse geocoding usando Nominatim
  const res = await this.http
    .get<any>(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`
    )
    .toPromise();

  if (res && res.address) {
    const { road, house_number, city, town, village, state, postcode } = res.address;

    // Armar dirección completa
    const address = [road, house_number].filter(Boolean).join(' ');

    this.form.patchValue({
      address: address || this.form.value.address,
      city: city || town || village || this.form.value.city,
      province: state || this.form.value.province,
      postalCode: postcode || this.form.value.postalCode,
    });
  }

  // Calcular envío con las nuevas coordenadas
  await this.calculateShippingFromCoordinates(pos.lat, pos.lng);
});

  }
}


async calculateShippingFromCoordinates(lat: number, lng: number) {
  if (!this.store) return;

  this.loading = true;

  // Llamada al backend para calcular envío usando lat/lng
  this.shippingService.calculateShippingFromCoordinates({
    storeId: this.store.id_tienda,
    lat,
    lng
  }).subscribe({
    next: (res) => {
      this.shippingResult = {
        distanceKm: res.distanceKm,
        pricePerKm: res.pricePerKm,
        totalCost: res.totalCost
      };

      // Actualizar envío y total
      this.envio = res.totalCost;
      this.total = this.subtotal + this.envio;

      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
    }
  });
}




  // =====================
  // Obtener datos de envío inicial
  // =====================
private getShippingData(storeId: string): void {
  this.shippingService.getShippingByStore(storeId).subscribe((res) => {
    const distanceKm = this.shippingResult?.distanceKm || 10; // o la que tengas calculada
    const totalCost = distanceKm * res.pricePerKm;

    this.shippingResult = {
      distanceKm,
      pricePerKm: res.pricePerKm,
      totalCost,
    };

    this.envio = totalCost;
    this.calculateTotals();
  });
}


  

  // =====================
  // Calcular envío desde dirección
  // =====================
async calculateShippingFromAddress(): Promise<void> {
  if (!this.store?.id_tienda) return;

  this.loading = true;

  const body = {
    storeId: this.store.id_tienda,
    address: this.form.value.address,
    city: this.form.value.city,
    province: this.form.value.province,
    postalCode: this.form.value.postalCode,
  };

  try {
    const result: any = await this.http.post(`${environment.apiUrl}/shipping/calculate-from-address`, body).toPromise();

    this.shippingResult = {
      distanceKm: result.distanceKm,
      totalCost: result.totalCost,
      pricePerKm: result.pricePerKm,
    };

    this.envio = result.totalCost;
    this.calculateTotals();

    // 🔹 Actualizar el mapa con la dirección del cliente
    this.updateMap(body.address, body.city, body.province);

  } catch (err) {
    console.error(err);
    alert('No se pudo calcular el envío');
  } finally {
    this.loading = false;
  }
}



  // =====================
  // Calcular totales
  // =====================
  calculateTotals(): void {
    this.subtotal = this.items.reduce((acc, item) => acc + item.precio_unit * item.cantidad, 0);
    this.total = this.subtotal + (this.envio || 0);
  }

  // =====================
  // Finalizar pedido
  // =====================
  placeOrder(): void {
    if (!this.form.valid) {
      alert('Completá los campos requeridos');
      return;
    }

    console.log('Pedido listo:', {
      form: this.form.value,
      cart: this.cart,
      shipping: this.shippingResult,
    });

    alert('Pedido finalizado exitosamente!');
  }
}
