import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';

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
    InputMaskModule,
    DialogModule,
    SkeletonModule,
  ],
  templateUrl: './store-contact.component.html',
  styleUrl: './store-contact.component.scss',
})
export class StoreContactComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  @Input() storeData: any;
  isLoading = true;
  showPreview = false;
  actionLabel: string = 'Siguiente paso';

  constructor(private storeService: StoreService, private fb: FormBuilder) {}

 ngOnInit(): void {
  this.form = this.fb.group({
    telefono_contacto: [''],
    email_contacto: ['', Validators.email],
    redes_sociales: this.fb.array<string>([]),
  });

  // 🔹 Obtenemos los datos de la tienda actual
  this.storeService.getMyStores().subscribe({
    next: (stores) => {
      if (stores?.length) {
        this.storeData = stores[0];
        const redes = (this.storeData as any).redes_sociales ?? [];

        // Cargar redes existentes
        redes.forEach((r: string) => this.redesSociales.push(this.fb.control(r)));

        // Asegurar mínimo 2 campos vacíos
        while (this.redesSociales.length < 2) this.addRed();

        // Cargar valores base
        this.form.patchValue({
          telefono_contacto: (this.storeData as any).telefono_contacto ?? '',
          email_contacto: (this.storeData as any).email_contacto ?? '',
        });

        // ✅ Si hay datos guardados, cambiamos el texto del botón
        if (
          this.storeData.telefono_contacto ||
          this.storeData.email_contacto ||
          (this.storeData.redes_sociales &&
            this.storeData.redes_sociales.length > 0)
        ) {
          this.actionLabel = 'Actualizar datos';
        }
      } else {
        // 🔸 No hay tienda todavía → modo creación
        this.storeData = null;
        this.addRed();
        this.addRed();
        this.actionLabel = 'Siguiente paso';
      }

      this.isLoading = false;
    },
    error: () => (this.isLoading = false),
  });

  // 🧠 Cambiar el texto dinámicamente cuando el usuario edita algo
  this.form.valueChanges.subscribe(() => {
    const v = this.form.value;
    if (
      v.telefono_contacto?.trim() ||
      v.email_contacto?.trim() ||
      (v.redes_sociales?.some((r: string) => !!r.trim()))
    ) {
      this.actionLabel = 'Actualizar datos';
    } else {
      this.actionLabel = 'Siguiente paso';
    }
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
    if (!this.storeData || !this.storeData.id_tienda) {
      alert('Primero debes completar la información básica de la tienda.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

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
        this.isLoading = false;
        this.form.markAsPristine();
        this.saved.emit(); // 🔥 Avanza al siguiente paso del stepper
      },
      error: () => {
        this.isLoading = false;
        alert('Error al guardar los datos de contacto');
      },
    });
  }
}
