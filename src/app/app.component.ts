import { Component, Inject, ViewChild, PLATFORM_ID } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterOutlet,
  ActivatedRoute,
} from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './shared/services/private_services/auth.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter, map, shareReplay, Subject, takeUntil } from 'rxjs';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CartService } from './shared/services/public_services/cart.service';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    SidebarComponent,
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    DragDropModule,
    CartDrawerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  cart$ = this.cartService.getCartObservable();
  slug: string | null = null;

  isHandset$ = this.breakpointObserver
    .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
    .pipe(
      map((result) => result.matches),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  sidenavMode: 'over' | 'side' = 'side';
  sidenavOpened = true;
  cartOpen = false;
  cartCount = 0;

  private destroy$ = new Subject<void>();
  public loggedIn$ = this.authService.loggedIn$;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    public cartService: CartService
  ) {
    // Contador de productos
    this.cart$.subscribe((cart) => {
      this.cartCount = cart.items.reduce((acc, it) => acc + it.cantidad, 0);
    });

    // Capturar el slug en rutas públicas como /store/:slug/*
   this.router.events
  .pipe(filter((e) => e instanceof NavigationEnd))
  .subscribe(() => {
    let current = this.route.root;
    while (current.firstChild) {
      current = current.firstChild;
    }

    const slug = current.snapshot.paramMap.get('slug');
    
    if (slug) {
      this.slug = slug;
      console.log('[AppComponent] Slug detectado:', this.slug);
      this.cartService.getCart(this.slug).subscribe({
        error: (err) => console.error('Error al cargar el carrito:', err)
      });
    } else {
      this.slug = null;
      console.warn('[AppComponent] No hay slug en esta ruta.');
    }
  });

    // Responsividad
    this.isHandset$.pipe(takeUntil(this.destroy$)).subscribe((isHandset) => {
      this.sidenavMode = isHandset ? 'over' : 'side';
      this.sidenavOpened = !isHandset;
    });
  }

  toggleSidebar() {
    if (!this.sidenav) return;
    this.sidenav.toggle();
  }

  openCartDrawer() {
    this.cartOpen = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
