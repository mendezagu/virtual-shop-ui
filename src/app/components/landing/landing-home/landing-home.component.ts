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
import { Producto } from '../../../shared/models/product.model';
import { CurrencyPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [  CurrencyPipe, CommonModule],
  templateUrl: './landing-home.component.html',
  styleUrl: './landing-home.component.scss',
})
export class LandingHomeComponent {
  hasStore = false;
  userData: JwtPayload | null = null;

  store: Store | null = null;
  topStockProducts: Producto[] = [];
  lowStockProducts: Producto[] = [];

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
    const cachedStore = this.storeState.getStore();

    if (cachedStore) {
      console.log('♻️ Tienda restaurada desde sesión:', cachedStore);
      this.store = cachedStore;
      this.hasStore = true;
      this.loadStockData();
      return;
    }

    // Si no hay tienda guardada, pedir al backend
    this.storeService.getMyStores().subscribe({
      next: (stores: Store[]) => {
        if (stores?.length > 0) {
          const mainStore = stores[0];
          console.log('🏪 Tienda cargada desde backend:', mainStore);
          this.store = mainStore;
          this.hasStore = true;
          this.storeState.setStore(mainStore);
          this.loadStockData();
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


   /** 🧮 Analiza los productos y separa los de mayor y menor stock */
  private loadStockData() {
    if (!this.store?.products ?.length) return;

    const sorted = [...this.store.products].sort((a, b) => b.stock - a.stock);

     // ✅ Solo los 2 con más stock
  this.topStockProducts = sorted.slice(0, 2);

  // ✅ Solo los 2 con menos stock (orden ascendente)
  this.lowStockProducts = sorted.slice(-2).reverse();
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

  redirectToMyCategories() {
    this.router.navigate(['/mis-categorias']);
  }

  redirectToMyOrders() {
    this.router.navigate(['/mis-pedidos']);
  }

 redirectToProduct(p: Producto) {
  this.router.navigate(['/my-products']);
}
}
