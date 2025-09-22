import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { Store } from '../../../shared/models/store.model';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  selector: 'app-store-contact',
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    InputMaskModule 
  ],
  templateUrl: './store-contact.component.html',
  styleUrl: './store-contact.component.scss',
})
export class StoreContactComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  storeData!: Store | null;
  isLoading = true;

  constructor(private storeService: StoreService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      telefono_contacto: [''],
      email_contacto: ['', Validators.email],
      redes_sociales: this.fb.array<string>([]),
    });

    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores?.length) {
          this.storeData = stores[0];
          const redes = (this.storeData as any).redes_sociales ?? [];

          // Cargar las redes existentes
          redes.forEach((r: string) =>
            this.redesSociales.push(this.fb.control(r))
          );

          // Si hay menos de 2 redes, rellenar hasta 2
          while (this.redesSociales.length < 2) {
            this.addRed();
          }

          this.form.patchValue({
            telefono_contacto: (this.storeData as any).telefono_contacto ?? '',
            email_contacto: (this.storeData as any).email_contacto ?? '',
          });
        } else {
          this.storeData = null;

          // Caso sin datos → crear 2 por defecto
          this.addRed();
          this.addRed();
        }

        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  get redesSociales(): FormArray {
    return this.form.get('redes_sociales') as FormArray;
  }

  addRed() {
    this.redesSociales.push(this.fb.control(''));
  }

  removeRed(i: number) {
    // Solo permitir eliminar si hay más de 2
    if (this.redesSociales.length > 2) {
      this.redesSociales.removeAt(i);
    }
  }

  save() {
    if (!this.storeData) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const payload = {
      telefono_contacto: v.telefono_contacto || undefined,
      email_contacto: v.email_contacto || undefined,
      redes_sociales: (v.redes_sociales || [])
        .map((x: string) => x?.trim())
        .filter(Boolean),
    };

    this.storeService.updateStore(this.storeData.id_tienda, payload).subscribe({
      next: () => {
        alert('Contacto actualizado');
        this.form.markAsPristine();
        this.saved.emit();
      },
      error: () => alert('Error al guardar contacto'),
    });
  }
}
