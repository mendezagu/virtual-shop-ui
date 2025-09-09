import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { Store } from '../../../shared/models/store.model';
import { AuthService } from '../../../shared/services/private_services/auth.service';
import { JwtPayload } from '../../../shared/models/jwt-payload.model';
import { BetSellersComponent } from '../../metrics/best-sellers/best-sellers.component';
import { RecentTransactionsComponent } from '../../metrics/recent-transactions/recent-transactions.component';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [MatIcon, BetSellersComponent, RecentTransactionsComponent],
  templateUrl: './landing-home.component.html',
  styleUrl: './landing-home.component.scss',
})
export class LandingHomeComponent {
  hasStore = false;
  userData: JwtPayload | null = null;

  constructor(
    private router: Router,
    private storeService: StoreService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.storeService.getMyStores().subscribe({
      next: (stores: Store[]) => {
        console.log('Mis tiendas:', stores);
        this.hasStore = stores && stores.length > 0; // si hay tiendas, marcar true
      },
      error: (err) => {
        console.error('Error al obtener tiendas:', err);
        this.hasStore = false;
      },
    });

    // Obtener datos del usuario desde el token
    const token = this.authService.getToken();
    if (token) {
      this.userData = this.authService.getUserData();
      console.log(this.userData?.nombre); // 👈 nombre
      console.log(this.userData); // 👈 todo el payload
    }
  }

  redirectToCreateStore() {
    this.router.navigate(['/create-store']);
  }

  redirectToMyStore() {
    this.router.navigate(['/my-store']);
  }

  redirectToCreateProduct() {
    this.router.navigate(['/create-product']);
  }

  redirectToMyProducts() {
    this.router.navigate(['/my-products']);
  }
}
