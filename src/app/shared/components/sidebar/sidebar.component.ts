import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

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
import confetti from 'canvas-confetti';

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
  @Input() collapsed = false; // controla si está colapsado o no
  @Output() collapsedChange = new EventEmitter<boolean>();

  @Input() mode: 'seller' | 'buyer' = 'seller'; // 👈 modo
  @Input() store: any; // 👈 datos de la tienda (solo para buyer)

  role: string | null = null;

   // ✅ Lista de opciones del modo vendedor
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
    // Arrancar el tour SOLO si es modo vendedor
    if (this.mode === 'seller') {
      setTimeout(() => this.startSellerTour(), 500);
    }
  }

  // ==============================
  // 🔹 TOUR SELLER
  // ==============================
  startSellerTour() {
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
      text: 'Este es el inicio de tu panel. Desde aquí podés volver a la pantalla principal.',
      attachTo: { element: '#tour-home', on: 'right' },
      buttons: [{ text: 'Siguiente', action: () => tour.next() }],
    });

    tour.addStep({
      id: 'store',
      text: 'En "Mi tienda" podés personalizar tu tienda digital.',
      attachTo: { element: '#tour-store', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => tour.back() },
        { text: 'Siguiente', action: () => tour.next() },
      ],
    });

    tour.addStep({
      id: 'products',
      text: 'Aquí gestionás tus productos: agregar, editar y eliminar.',
      attachTo: { element: '#tour-products', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => tour.back() },
        { text: 'Siguiente', action: () => tour.next() },
      ],
    });

    tour.addStep({
      id: 'categories',
      text: 'Y acá podés crear y organizar tus categorías de productos.',
      attachTo: { element: '#tour-categories', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => tour.back() },
        { text: 'Finalizar', action: () => this.finishTour(tour) },
      ],
    });

    tour.start();
  }

  private finishTour(tour: Shepherd.Tour) {
    tour.complete();
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.6 },
    });
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

  redirectToHome() { this.router.navigate(['/landing-home']); }
  redirectToStepper() { this.router.navigate(['/my-store']); }
  redirectToMyStore() { this.router.navigate(['/my-store']); }
  redirectToMyProducts() { this.router.navigate(['/my-products']); }
  redirectToMyCategories() { this.router.navigate(['/mis-categorias']); }
  redirectToMyOrders() { this.router.navigate(['/mis-pedidos']); }
}
