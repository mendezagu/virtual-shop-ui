import { Component, OnInit } from '@angular/core';
import { StoreService } from '../../../shared/services/private_services/store.service';
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
export class StorePageComponent implements OnInit{

isLoading = true;
  hasStore = false;

  constructor(private storeService: StoreService) {}

ngOnInit(): void {
    this.storeService.getMyStores().subscribe({
      next: (stores: Store[]) => {
        console.log('Stores recibidas:', stores);
        this.hasStore = Array.isArray(stores) && stores.length > 0;
        console.log('hasStore:', this.hasStore);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando tiendas:', err);
        this.hasStore = false;
        this.isLoading = false;
      },
    });
  }
}
