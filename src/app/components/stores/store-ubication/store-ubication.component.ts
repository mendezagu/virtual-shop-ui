import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { Store } from '../../../shared/models/store.model';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-store-ubication',
  standalone: true,
  imports: [MatButtonModule, ReactiveFormsModule, CommonModule, InputComponent],
  templateUrl: './store-ubication.component.html',
  styleUrl: './store-ubication.component.scss',
})
export class StoreUbicationComponent {
@Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  storeData!: Store | null;
  isLoading = true;

  constructor(private storeService: StoreService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      direccion: [''],
      ciudad: [''],
      latitud: [null],
      longitud: [null],
    });

    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores?.length) {
          this.storeData = stores[0];
          this.form.patchValue({
            direccion: (this.storeData as any).direccion ?? '',
            ciudad: (this.storeData as any).ciudad ?? '',
            latitud: (this.storeData as any).latitud ?? null,
            longitud: (this.storeData as any).longitud ?? null,
          });
        } else {
          this.storeData = null;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  /*save() {
    if (!this.storeData) return;

    const v = this.form.value;
    const payload = {
      direccion: v.direccion || undefined,
      ciudad: v.ciudad || undefined,
      latitud: v.latitud != null ? Number(v.latitud) : undefined,
      longitud: v.longitud != null ? Number(v.longitud) : undefined,
    };

    this.storeService.updateStore(this.storeData.id_tienda, payload).subscribe({
      next: () => { alert('Ubicación actualizada'); this.form.markAsPristine(); this.saved.emit(); },
      error: () => alert('Error al guardar ubicación'),
    });
  }*/
}
