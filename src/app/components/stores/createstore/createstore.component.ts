import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-createstore',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './createstore.component.html',
  styleUrls: ['./createstore.component.scss'],
})
export class CreatestoreComponent {
  @Output() saved = new EventEmitter<any>();

  isLoading = false;
  storeForm: FormGroup;

  constructor(private fb: FormBuilder, private storeService: StoreService) {
    this.storeForm = this.fb.group({
      nombre_tienda: ['', [Validators.required, Validators.minLength(2)]],
      telefono_contacto: ['', [Validators.required]],
      usuario_login: ['', [Validators.required]],
      password_hash: [''], // puede ser opcional si luego se setea por otro flujo
      rubro: ['', [Validators.required]], // "Ropa, Accesorios"
      // opcionales sugeridos:
      email_contacto: [''],
      redes_sociales: [''], // "https://instagram.com/xxx, https://facebook.com/xxx"
    });
  }

  get f() { return this.storeForm.controls; }

  createStore() {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    // Normalizaciones
    const raw = this.storeForm.value;

    const rubroArray = raw.rubro
      ? String(raw.rubro).split(',').map((r: string) => r.trim()).filter(Boolean)
      : [];

    const redesArray = raw.redes_sociales
      ? String(raw.redes_sociales).split(',').map((r: string) => r.trim()).filter(Boolean)
      : [];

    const payload = {
      nombre_tienda: raw.nombre_tienda,
      telefono_contacto: raw.telefono_contacto,
      usuario_login: raw.usuario_login,
      password_hash: raw.password_hash || undefined,
      rubro: rubroArray,
      email_contacto: raw.email_contacto || undefined,
      redes_sociales: redesArray.length ? redesArray : undefined,
    };

    this.isLoading = true;
    this.storeService.createStore(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Emitimos para que el stepper avance
        this.saved.emit(res);
        // opcional: reset form si querés
        // this.storeForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al crear tienda:', err);
        alert('No se pudo crear la tienda. Intenta nuevamente.');
      },
    });
  }
}
