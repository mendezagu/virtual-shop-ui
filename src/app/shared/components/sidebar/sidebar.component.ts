import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../services/private_services/auth.service';
import { Router } from '@angular/router';
import { StoreService } from '../../services/private_services/store.service';
import { CommonModule } from '@angular/common';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { StyleClassModule } from 'primeng/styleclass';
import Shepherd from 'shepherd.js';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    SidebarModule,
    ButtonModule,
    RippleModule,
    AvatarModule,
    StyleClassModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  private _mode: 'seller' | 'buyer' = 'seller';
  @Input() set mode(value: 'seller' | 'buyer') {
    this._mode = value;
    // ⚡ Si cambia a vendedor y aún no se mostró el tour, lanzarlo
    if (value === 'seller') {
      setTimeout(() => this.startSellerTourSafely(), 700);
    }
  }
  get mode() {
    return this._mode;
  }

  @Input() store: any;
  role: string | null = null;

  sellerItems = [
    {
      id: 'home',
      icon: 'pi pi-home',
      text: 'Home',
      action: () => this.redirectToHome(),
    },
    {
      id: 'store',
      icon: 'pi pi-shop',
      text: 'Mi tienda',
      action: () => this.redirectToStepper(),
    },
    {
      id: 'products',
      icon: 'pi pi-shopping-bag',
      text: 'Mis productos',
      action: () => this.redirectToMyProducts(),
    },
    {
      id: 'categories',
      icon: 'pi pi-tags',
      text: 'Categorías',
      action: () => this.redirectToMyCategories(),
    },
    {
      id: 'orders',
      icon: 'pi pi-tags',
      text: 'Lista de pedidos',
      action: () => this.redirectToMyOrders(),
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private storeService: StoreService
  ) {}

  ngAfterViewInit(): void {
    // ⚠️ No iniciar nada acá: el setter maneja el modo
  }

  // ==============================
  // 🔹 TOUR SOLO PARA SELLER
  // ==============================
  private startSellerTourSafely() {
    // 🛑 Si no es modo vendedor, salimos
    if (this.mode !== 'seller') return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        scrollTo: false,
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-lg p-3',
      },
    });

    tour.addStep({
      id: 'home',
      text: `
        <div class="font-semibold text-lg mb-1 text-indigo-600">🏠 Inicio</div>
        <div class="text-sm text-gray-700">
          Este es el inicio de tu panel. Desde aquí podés volver a la pantalla principal.
        </div>
      `,
      attachTo: { element: '#tour-home', on: 'right' },
      buttons: [{ text: 'Siguiente', action: () => tour.next() }],
    });

    tour.addStep({
      id: 'store',
      text: `
        <div class="font-semibold text-lg mb-1 text-indigo-600 flex items-center gap-2">
          🏬 Mi tienda
        </div>
        <div class="text-sm text-gray-700">
          Acá podés <b>personalizar tu tienda digital</b>: elegí colores, logo y estilo para reflejar tu marca.
        </div>
      `,
      attachTo: { element: '#tour-store', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => tour.back() },
        { text: 'Siguiente', action: () => tour.next() },
      ],
    });

    tour.addStep({
      id: 'products',
      text: `
        <div class="font-semibold text-lg mb-1 text-indigo-600 flex items-center gap-2">
          🛒 Mis productos
        </div>
        <div class="text-sm text-gray-700">
          Desde esta sección podés <b>agregar, editar o eliminar productos</b>.<br>
          Cada uno puede tener su imagen, descripción y precio configurado.
        </div>
      `,
      attachTo: { element: '#tour-products', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => tour.back() },
        { text: 'Siguiente', action: () => tour.next() },
      ],
    });

    tour.addStep({
      id: 'categories',
      text: `
        <div class="font-semibold text-lg mb-1 text-indigo-600 flex items-center gap-2">
          🏷️ Categorías
        </div>
        <div class="text-sm text-gray-700">
          Organizá tus productos creando <b>categorías</b> como "Bebidas", "Ropa" u "Ofertas".<br>
          Así tus clientes encontrarán todo más fácilmente.
        </div>
      `,
      attachTo: { element: '#tour-categories', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => tour.back() },
        { text: 'Siguiente', action: () => tour.next() },
      ],
    });

    tour.addStep({
      id: 'orders',
      text: `
        <div class="font-semibold text-lg mb-1 text-indigo-600 flex items-center gap-2">
          🏷️ Mis pedidos
        </div>
        <div class="text-sm text-gray-700">
          Aquí podés revisar y gestionar todos los pedidos recibidos en tu tienda. Consultá el detalle, cambiá su estado o cancelalos si es necesario.
        </div>
      `,
      attachTo: { element: '#tour-orders', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => tour.back() },
        { text: 'Finalizar', action: () => this.finishTour(tour) },
      ],
    });

    tour.start();
  }

  private finishTour(tour: Shepherd.Tour) {
    tour.complete();
  }

  // ==============================
  // 🔹 Navegación y logout
  // ==============================
  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  redirectToHome() {
    this.router.navigate(['/landing-home']);
  }
  redirectToStepper() {
    this.router.navigate(['/my-store']);
  }
  redirectToMyStore() {
    this.router.navigate(['/my-store']);
  }
  redirectToMyProducts() {
    this.router.navigate(['/my-products']);
  }
  redirectToMyCategories() {
    this.router.navigate(['/mis-categorias']);
  }
  redirectToMyOrders() {
    this.router.navigate(['/mis-pedidos']);
  }
}
