import { Component } from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/private_services/auth.service';
import { Router } from '@angular/router';
import { StoreService } from '../../services/private_services/store.service';
import { MatIcon } from "@angular/material/icon";
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatSidenavModule, MatListModule, MatIcon, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
    role: string | null = null;
  constructor(
    private authService: AuthService,
    private router: Router,
    private storeService: StoreService
  ) {
    this.role = this.authService.getUserRole();
    console.log(this.role, 'ROLE');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  redirectToHome() {
    this.router.navigate(['/landing-home']);
  }

  redirectToStepper() {
    this.router.navigate(['/stepper']);
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
      }
    });
  }

}
