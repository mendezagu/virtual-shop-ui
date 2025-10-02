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

  constructor(
    private authService: AuthService,
    private router: Router,
    private storeService: StoreService
  ) {}

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
}
