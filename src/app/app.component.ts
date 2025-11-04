import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { AuthService } from './shared/services/private_services/auth.service';
import { StoreStateService } from './shared/services/private_services/store-state.service';
import { filter } from 'rxjs/operators';
import {
  CartItem,
  CartService,
} from './shared/services/public_services/cart.service';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    SidebarModule,
    ButtonModule,
    CartDrawerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  collapsed = false;
  sidebarVisible = false;
  isLoggedIn = false;
  isMobile = false;
  mode: 'seller' | 'buyer' = 'seller';
  store: any;

  cartOpen = false;
  cartItems: CartItem[] = [];
  cartTotal = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private storeState: StoreStateService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.subscribeCart();

    if (isPlatformBrowser(this.platformId)) {
      this.checkMobile();
      window.addEventListener('resize', () => this.checkMobile());
    }

    this.isLoggedIn = this.authService.isAuthenticated();
    this.authService.loggedIn$.subscribe(
      (status) => (this.isLoggedIn = status)
    );

    // 🔹 Detectar el modo según la ruta actual
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects;

        // ==============================
        // 🛍️ MODO COMPRADOR
        // ==============================
        if (
          url.startsWith('/store/') ||
          url.startsWith('/producto/') ||
          url.startsWith('/successful-payment') ||
          url.startsWith('/pending-payment') ||
          url.startsWith('/failed-payment')
        ) {
          this.mode = 'buyer';

          this.storeState.store$.subscribe((s) => {
            this.store = s;
            if (this.store) this.applyBuyerTheme(this.store);
          });
        }

        // ==============================
        // 🧑‍💼 MODO VENDEDOR
        // ==============================
        else {
          this.mode = 'seller';
          this.storeState.clearStore();
          this.store = null;
          this.applySellerTheme();
        }
      });
  }

  /** 🛒 Suscribirse a los cambios del carrito */
  private subscribeCart() {
    this.cartService.cart$.subscribe((cart) => {
      this.cartItems = cart.items;
      this.cartTotal = cart.total;
    });
  }

  /** 🔓 Mostrar u ocultar el drawer del carrito */
  toggleCartDrawer() {
    this.cartOpen = !this.cartOpen;
  }

  /** 📱 Detectar si es mobile */
  private checkMobile() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 768;
      if (this.isMobile) this.collapsed = true;
    }
  }

  /** 🎨 Tema vendedor */
  private applySellerTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#7e22ce');
    root.style.setProperty('--secondary', '#ec4899');
    root.style.setProperty('--bg', '#ffffff');
    root.style.setProperty('--text', '#111827');
    if (typeof document === 'undefined') return;
  }

  /** 🎨 Tema comprador (colores desde backend) */
  applyBuyerTheme(store: any) {
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
  }

  /** 🍔 Toggle Sidebar */
  toggleSidebar() {
    if (this.isMobile) {
      this.sidebarVisible = !this.sidebarVisible;
    } else {
      this.collapsed = !this.collapsed;
    }
  }

  updateItem(event: { itemId: string; cantidad: number }) {
    const slug = this.store?.link_tienda || this.store?.slug;
    if (!slug) return console.warn('❌ No hay slug de tienda');
    this.cartService.update(slug, event.itemId, event.cantidad).subscribe();
  }

  removeItem(itemId: string) {
    const slug = this.store?.link_tienda || this.store?.slug;
    if (!slug) return console.warn('❌ No hay slug de tienda');
    this.cartService.remove(slug, itemId).subscribe();
  }

  clearCart() {
    const slug = this.store?.link_tienda || this.store?.slug;
    if (!slug) return console.warn('❌ No hay slug de tienda');
    this.cartService.clear(slug).subscribe();
  }
}
