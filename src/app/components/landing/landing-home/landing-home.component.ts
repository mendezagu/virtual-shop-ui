import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { Store } from '../../../shared/models/store.model';
import { AuthService } from '../../../shared/services/private_services/auth.service';
import { JwtPayload } from '../../../shared/models/jwt-payload.model';
import { BetSellersComponent } from '../../metrics/best-sellers/best-sellers.component';
import { RecentTransactionsComponent } from '../../metrics/recent-transactions/recent-transactions.component';
import { StoreStateService } from '../../../shared/services/private_services/store-state.service';

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
    private storeState: StoreStateService,
    private authService: AuthService
  ) {}


  ngOnInit(): void {
    this.loadUserData();
    this.loadStoreData();
  }

  private loadUserData() {
    const token = this.authService.getToken();
    if (token) {
      this.userData = this.authService.getUserData();
      console.log('👤 Usuario:', this.userData);
    }
  }

  private loadStoreData() {
  // Primero, intentar recuperar desde StoreStateService
const cachedStore = this.storeState.getStore();

if (cachedStore) {
  console.log('♻️ Tienda restaurada desde sesión:', cachedStore);
  this.hasStore = true;
  return; // 👈 no hacemos llamada HTTP innecesaria
}

// Si no hay tienda guardada, la pedimos al backend
this.storeService.getMyStores().subscribe({
  next: (stores: Store[]) => {
    if (stores?.length > 0) {
      const mainStore = stores[0];
      this.hasStore = true;
      console.log('🏪 Tienda cargada desde backend:', mainStore);
      this.storeState.setStore(mainStore);
    } else {
      console.warn('⚠️ No hay tienda registrada');
      this.hasStore = false;
    }
  },
  error: (err) => {
    console.error('❌ Error al obtener tiendas:', err);
    this.hasStore = false;
  },
});
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

  redirectToMyCategories(){
    this.router.navigate(['/mis-categorias']);
  }

  redirectToMyOrders(){
    this.router.navigate(['/mis-pedidos'])
  }
}
