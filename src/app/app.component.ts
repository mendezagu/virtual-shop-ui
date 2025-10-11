import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { AuthService } from './shared/services/private_services/auth.service';
import { StoreStateService } from './shared/services/private_services/store-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    SidebarModule,
    ButtonModule,
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private storeState: StoreStateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobile();
      window.addEventListener('resize', () => this.checkMobile());
    }

    this.isLoggedIn = this.authService.isAuthenticated();
    this.authService.loggedIn$.subscribe((status) => (this.isLoggedIn = status));

    // Detectar modo
    this.router.events.subscribe(() => {
      const url = this.router.url;

      if (url.startsWith('/store/')) {
        // 🛍️ MODO COMPRADOR
        this.mode = 'buyer';
        this.storeState.store$.subscribe((s) => {
          this.store = s;
          if (this.store) this.applyBuyerTheme(this.store);
        });
      } else {
        // 🧑‍💼 MODO VENDEDOR
        this.mode = 'seller';
        this.storeState.clearStore();
        this.store = null;
        this.applySellerTheme();
      }
    });
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
  }

  /** 🎨 Tema comprador (colores desde backend) */
  private applyBuyerTheme(store: any) {
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
}
