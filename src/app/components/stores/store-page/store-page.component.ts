import { Component, OnInit } from '@angular/core';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { StoreStateService } from '../../../shared/services/private_services/store-state.service'; // 👈 importar
import { Store } from '../../../shared/models/store.model';
import { CreateStepperComponent } from "../../../shared/components/create-stepper/create-stepper.component";
import { StepperComponent } from "../../../shared/components/stepper/stepper.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-store-page',
  standalone: true,
  imports: [CreateStepperComponent, StepperComponent, CommonModule],
  templateUrl: './store-page.component.html',
  styleUrl: './store-page.component.scss'
})
export class StorePageComponent implements OnInit {

  isLoading = true;
  hasStore = false;

  constructor(
    private storeService: StoreService,
    private storeState: StoreStateService // 👈 inyectar
  ) {}

  ngOnInit(): void {
    this.loadStoreData();
  }

  private loadStoreData(): void {
    const cachedStore = this.storeState.getStore();

if (cachedStore) {
  console.log('♻️ Tienda restaurada desde sesión:', cachedStore);
  this.hasStore = true;
  this.isLoading = false;
  return;
}

this.storeService.getMyStores().subscribe({
  next: (stores: Store[]) => {
    if (stores?.length > 0) {
      const mainStore = stores[0];
      this.hasStore = true;
      this.storeState.setStore(mainStore);
      console.log('🏪 Tienda cargada desde backend:', mainStore);
    } else {
      console.warn('⚠️ No hay tienda asociada');
      this.hasStore = false;
    }
    this.isLoading = false;
  },
  error: (err) => {
    console.error('❌ Error al obtener tiendas:', err);
    this.hasStore = false;
    this.isLoading = false;
  }
});
  }
}
