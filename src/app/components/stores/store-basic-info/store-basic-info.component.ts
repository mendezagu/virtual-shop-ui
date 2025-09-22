import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { Store } from '../../../shared/models/store.model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InputComponent } from '../../../shared/components/input/input.component';
import { TextareaComponent } from '../../../shared/components/textarea/textarea.component';
import { CommonModule } from '@angular/common';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';

interface Category {
  name: string;
  code: string;
}

@Component({
  selector: 'app-basic-store-info',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    FormsModule, // para compatibilidad, aunque solo usarás ReactiveForms
    MessagesModule,
    InputTextModule,
    DropdownModule,
    EditorModule,
    ButtonModule
  ],
  templateUrl: './store-basic-info.component.html',
  styleUrls: ['./store-basic-info.component.scss'],
})
export class MyStoreComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  text: string | undefined;
  storeForm!: FormGroup;
  storeData!: Store | null;
  isLoading = true;
  messages: Message[] = [];

  categories: Category[] = [
    { name: 'Tecnologia', code: 'Tech' },
    { name: 'Electronica', code: 'Elec' },
    { name: 'Limpieza', code: 'Limp' },
  ];

  constructor(private storeService: StoreService, private fb: FormBuilder) {}

ngOnInit(): void {
  this.messages = [
    {
      severity: 'info',
      detail:
        'Tip: mantené el nombre corto para generar un link legible. Esto mejora cómo aparece tu tienda en las búsquedas.',
    },
  ];

  this.storeForm = this.fb.group({
    nombre_tienda: ['', [Validators.required, Validators.minLength(2)]],
    rubro: ['', Validators.required],
    descripcion: [''],
    link_tienda: [''],
  });

  // Ejemplo: preseleccionar categoría
  this.storeForm.patchValue({ rubro: this.categories[0] });

  // 🔥 Auto-generar link a partir del nombre
  this.storeForm.get('nombre_tienda')?.valueChanges.subscribe((nombre: string) => {
    if (nombre) {
      const slug = nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')          // espacios a guiones
        .replace(/[^a-z0-9\-]/g, ''); // solo letras/números/guiones

      this.storeForm.patchValue(
        { link_tienda: `https://${slug}` },
        { emitEvent: false } // evita loop infinito
      );
    } else {
      this.storeForm.patchValue(
        { link_tienda: 'https://' },
        { emitEvent: false }
      );
    }
  });

  // Si traes datos de backend:
  this.storeService.getMyStores().subscribe({
    next: (stores: Store[]) => {
      if (stores?.length > 0) {
        this.storeData = stores[0];
        this.storeForm.patchValue({
          ...this.storeData,
          rubro:
            this.categories.find((c) =>
              Array.isArray(this.storeData?.rubro)
                ? this.storeData?.rubro.includes(c.code)
                : c.code === this.storeData?.rubro
            ) || null,
        });
      } else {
        this.storeData = null;
      }
      this.isLoading = false;
    },
    error: () => {
      this.isLoading = false;
    },
  });
}

  get f() {
    return this.storeForm.controls;
  }

saveChanges() {
  if (this.storeForm.invalid) {
    this.storeForm.markAllAsTouched();
    return;
  }

  const v = this.storeForm.value;

  // 🔥 rubro debe ser array
  const payload = {
    ...v,
    rubro: v.rubro ? [v.rubro.code] : [],
  };

  // 🚫 el backend no acepta link_tienda → lo quitamos
  delete (payload as any).link_tienda;

  if (this.storeData) {
    this.storeService
      .updateStore(this.storeData.id_tienda, payload)
      .subscribe({
        next: () => {
          alert('Cambios guardados correctamente');
          this.storeForm.markAsPristine();
          this.saved.emit();
        },
        error: () => alert('Error al guardar cambios'),
      });
  } else {
    this.storeService.createStore(payload).subscribe({
      next: (newStore) => {
        alert('Tienda creada correctamente');
        this.storeData = newStore;
        this.saved.emit();
      },
      error: () => alert('Error al crear tienda'),
    });
  }
}


}
