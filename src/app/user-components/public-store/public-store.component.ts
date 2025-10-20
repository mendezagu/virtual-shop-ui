import { Component } from '@angular/core';
import { PublicStoreService } from '../../shared/services/public_services/publicstore.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { StoreStateService } from '../../shared/services/private_services/store-state.service';

// primeng
import { DataViewModule } from 'primeng/dataview';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-public-store',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    DataViewModule,
    CarouselModule,
    TagModule,
    CardModule,
  ],
  templateUrl: './public-store.component.html',
  styleUrl: './public-store.component.scss',
})
export class PublicStoreComponent {
  categories: any[] = [];
  featuredCategories: any[] = [];
  normalCategories: any[] = [];
  // 👇 NUEVO: control de paginado local
  visibleNormalCategories: any[] = [];
  itemsToShow = 4; // Cuántas categorías mostrar inicialmente
  step = 4; // Cuántas agregar cada vez que se hace clic

  slug!: string;
  store: any;

  isLoading = true;
  hasError = false;

  constructor(
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService,
    private storeState: StoreStateService
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug')!;

    // 1️⃣ Cargar datos de la tienda
    this.publicStoreService.getStoreBySlug(this.slug).subscribe({
      next: (data) => {
        this.store = data;
        this.storeState.setStore(data); // ✅ Guardar globalmente
        this.isLoading = false;

        // 🎨 Aplicar colores a nivel local (este componente)
        const el = document.querySelector('app-public-store') as HTMLElement;
        if (el) {
          el.style.setProperty(
            '--primary',
            this.store.primary_color || '#ff4081'
          );
          el.style.setProperty(
            '--secondary',
            this.store.secondary_color || '#00bfa5'
          );
          el.style.setProperty(
            '--bg',
            this.store.background_color === 'dark' ? '#202123' : '#ffffff'
          );
          el.style.setProperty(
            '--text',
            this.store.background_color === 'dark' ? '#f5f5f5' : '#111827'
          );
        }

        // 🎨 Aplicar colores también a nivel global (document root)
        const root = document.documentElement;
        root.style.setProperty(
          '--primary',
          this.store.primary_color || '#ff4081'
        );
        root.style.setProperty(
          '--secondary',
          this.store.secondary_color || '#00bfa5'
        );
        root.style.setProperty(
          '--bg',
          this.store.background_color === 'dark'
            ? '#202123'
            : this.store.background_color || '#ffffff'
        );
        root.style.setProperty(
          '--text',
          this.store.background_color === 'dark' ? '#f5f5f5' : '#111827'
        );

        // ✅ Fondo general de la página
        document.body.style.backgroundColor =
          this.store.background_color === 'dark' ? '#202123' : '#ffffff';
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });

    // 2️⃣ Cargar categorías
    this.publicStoreService.getCategories(this.slug).subscribe((res) => {
      this.categories = res.data || [];
      this.featuredCategories = this.categories.filter(
        (c) => c.type && c.type !== 'NORMAL'
      );
      this.normalCategories = this.categories.filter(
        (c) => !c.type || c.type === 'NORMAL'
      );
      // 👇 Mostrar solo las primeras 4
      this.visibleNormalCategories = this.normalCategories.slice(
        0,
        this.itemsToShow
      );
    });
  }

  // 👇 NUEVA FUNCIÓN: para mostrar más categorías
  loadMoreCategories() {
    const currentLength = this.visibleNormalCategories.length;
    const nextItems = this.normalCategories.slice(
      currentLength,
      currentLength + this.step
    );
    this.visibleNormalCategories = [
      ...this.visibleNormalCategories,
      ...nextItems,
    ];
  }

  // 👇 Para ocultar el botón cuando ya se cargaron todas
  allCategoriesLoaded(): boolean {
    return this.visibleNormalCategories.length >= this.normalCategories.length;
  }

  // Helpers
  rubros(): string[] {
    const r = this.store?.rubro;
    if (!r) return [];
    return Array.isArray(r)
      ? r
      : String(r)
          .split(',')
          .map((x: string) => x.trim());
  }

  // Devuelve el handle de Instagram sin '@' ni slashes finales
  getInstagramHandle(url?: string): string {
    if (!url) return '';
    const cleaned = url.replace(/\/+$/, '');
    const last = cleaned.split('/').pop() || '';
    return last.startsWith('@') ? last.slice(1) : last;
  }

  getCategoryImage(c: { name: string; slug: string }): string | null {
    const map: Record<string, string> = {
      restaurantes: '/assets/categorias/restaurantes.png',
      'pedidosya-market': '/assets/categorias/market.png',
      mercados: '/assets/categorias/mercados.png',
      helados: '/assets/categorias/helados.png',
      kioscos: '/assets/categorias/kioscos.png',
      bebidas: '/assets/categorias/bebidas.png',
    };
    const key = (c.slug || '').toLowerCase();
    return map[key] ?? null;
  }

  getPaymentIcon(metodo: string): string {
    const icons: Record<string, string> = {
      EFECTIVO: 'pi-money-bill',
      TARJETA: 'pi-credit-card',
      TRANSFERENCIA: 'pi-wallet',
      MERCADOPAGO: 'pi-paypal',
      DEBITO: 'pi-credit-card',
      CREDITO: 'pi-credit-card',
      PIX: 'pi-globe',
      OTRO: 'pi-question-circle',
    };

    return icons[metodo.toUpperCase()] || 'pi-wallet';
  }

  formatPaymentMethod(metodo: string): string {
    if (!metodo) return '';

    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TRANSFERENCIA_BANCARIA: 'Transferencia',
      TARJETA: 'Tarjeta',
      MERCADOPAGO: 'Mercado Pago',
      DEBITO: 'Débito',
      CREDITO: 'Crédito',
    };

    // Si existe en el mapa, devolvemos la traducción
    if (map[metodo.toUpperCase()]) return map[metodo.toUpperCase()];

    // Si no está en el mapa, lo convertimos genéricamente:
    // - Reemplazamos guiones bajos por espacios
    // - Ponemos mayúscula inicial
    const clean = metodo.toLowerCase().replace(/_/g, ' ').trim();

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  getLogisticIcon(metodo: string): string {
    if (!metodo) return 'pi-question-circle';

    const icons: Record<string, string> = {
      ENVIO_DOMICILIO: 'pi-truck',
      RETIRO_TIENDA: 'pi-shopping-bag',
      MOTO_MENSAJERIA: 'pi-send',
      PICKUP_POINT: 'pi-map-marker',
    };

    return icons[metodo.toUpperCase()] || 'pi-truck';
  }

  formatLogisticMethod(metodo: string): string {
    if (!metodo) return '';

    const map: Record<string, string> = {
      ENVIO_DOMICILIO: 'Envío a domicilio',
      RETIRO_TIENDA: 'Retiro en tienda',
      MOTO_MENSAJERIA: 'Moto mensajería',
      PICKUP_POINT: 'Punto de retiro',
    };

    // Si existe en el mapa, devolvemos su nombre legible
    if (map[metodo.toUpperCase()]) return map[metodo.toUpperCase()];

    // Si no está en el mapa, generamos uno genérico (reemplaza guiones y pone mayúscula inicial)
    const clean = metodo.toLowerCase().replace(/_/g, ' ').trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
}
