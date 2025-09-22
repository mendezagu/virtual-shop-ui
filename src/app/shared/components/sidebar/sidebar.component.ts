import { Component, EventEmitter, Inject, Input, Output, PLATFORM_ID } from '@angular/core';

import { AuthService } from '../../services/private_services/auth.service';
import { Router } from '@angular/router';
import { StoreService } from '../../services/private_services/store.service';

import { CommonModule, isPlatformBrowser } from '@angular/common';

import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { StyleClassModule } from 'primeng/styleclass';

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
   @Input() visible = false; // 👈 el padre controla visibilidad

  // 🚀 Emite evento cuando se cierra
  @Output() visibleChange = new EventEmitter<boolean>();

  toggle() {
    this.visible = !this.visible;
  }

close() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  sidebarVisible: boolean = false;
  role: string | null = null;
  constructor(
    private authService: AuthService,
    private router: Router,
    private storeService: StoreService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
    this.role = this.authService.getUserRole();
  }
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
    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (!stores || stores.length === 0) {
          // No tiene tienda → lo mando a crear
          this.router.navigate(['/create-store']);
        } else {
          // Ya tiene tienda → lo mando a "mi tienda"
          this.router.navigate(['/my-store']);
        }
      },
      error: (err) => {
        console.error('Error al obtener tiendas', err);
        // Manejo básico: lo mando a crear tienda por defecto
        this.router.navigate(['/create-store']);
      },
    });
  }
  redirectToMyProducts() {
    this.router.navigate(['/my-products']);
  }

  redirectToMyCategories() {
    this.router.navigate(['/mis-categorias']);
  }
}
