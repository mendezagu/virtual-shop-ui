import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { Store } from '../../../shared/models/store.model';
import { NgxColorsModule } from 'ngx-colors';

@Component({
  selector: 'app-store-personalization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ColorPickerModule, ButtonModule, TooltipModule, NgxColorsModule],
  templateUrl: './store-personalization.component.html',
  styleUrls: ['./store-personalization.component.scss']
})
export class StorePersonalizationComponent implements OnInit {
  storeForm!: FormGroup;
  storeId!: string; // 👈 aquí guardamos el id real de la tienda
  loading = true;

  constructor(private fb: FormBuilder, private storeService: StoreService) {}

  ngOnInit(): void {
    this.storeForm = this.fb.group({
      primary_color: ['#1E90FF'],
      secondary_color: ['#FFD700']
    });

    // 🚀 Traemos las tiendas del usuario
    this.storeService.getMyStores().subscribe({
      next: (stores: Store[]) => {
        if (stores.length > 0) {
          const store = stores[0]; // 👈 aquí podrías elegir según lógica de negocio
          this.storeId = store.id_tienda;

          // Rellenamos los colores existentes
          this.storeForm.patchValue({
            primary_color: store.primary_color || '#1E90FF',
            secondary_color: store.secondary_color || '#FFD700'
          });
        } else {
          alert('⚠️ No tienes ninguna tienda creada aún.');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando tiendas:', err);
        alert('❌ No se pudieron cargar tus tiendas');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.storeForm.valid && this.storeId) {
      const formData = this.storeForm.value;

      this.storeService.updateStore(this.storeId, formData).subscribe({
        next: (res) => {
          console.log('Tienda actualizada con éxito:', res);
          alert('✅ Colores guardados correctamente');
        },
        error: (err) => {
          console.error('Error al actualizar tienda:', err);
          alert('❌ Hubo un error al guardar los cambios');
        }
      });
    }
  }
}
