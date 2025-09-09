import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { Store } from '../../../shared/models/store.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InputComponent } from '../../../shared/components/input/input.component';
import { TextareaComponent } from '../../../shared/components/textarea/textarea.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-basic-store-info',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    InputComponent,
    TextareaComponent
  ],
  templateUrl: './store-basic-info.component.html',
  styleUrls: ['./store-basic-info.component.scss'],
})
export class MyStoreComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  storeForm!: FormGroup;
  storeData!: Store | null;
  isLoading = true;

  constructor(private storeService: StoreService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.storeForm = this.fb.group({
      nombre_tienda: ['', [Validators.required, Validators.minLength(2)]],
      rubro: [''],
      descripcion: [''],
      link_tienda: [''],
    });

    this.storeService.getMyStores().subscribe({
      next: (stores: Store[]) => {
        if (stores?.length > 0) {
          this.storeData = stores[0];
          const rubroText = Array.isArray(this.storeData.rubro)
            ? this.storeData.rubro.join(', ')
            : (this.storeData as any).rubro ?? '';

          this.storeForm.patchValue({
            ...this.storeData,
            rubro: rubroText,
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

  get f() { return this.storeForm.controls; }

  saveChanges() {
    if (!this.storeData) return;
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    const v = this.storeForm.value;
    const rubro = v.rubro
      ? String(v.rubro).split(',').map((r: string) => r.trim()).filter(Boolean)
      : [];

    if (rubro.length === 0) {
      alert('Debes ingresar al menos un rubro (separado por comas).');
      return;
    }

    let link = v.link_tienda || '';
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    if (link && !/^https?:\/\/.+\..+/.test(link)) {
      alert('El link de la tienda debe ser una URL válida');
      return;
    }

    const payload = { ...v, rubro, link_tienda: link || undefined };

    this.storeService.updateStore(this.storeData.id_tienda, payload).subscribe({
      next: () => {
        alert('Cambios guardados correctamente');
        this.storeForm.markAsPristine();
        this.saved.emit();
      },
      error: () => alert('Error al guardar cambios'),
    });
  }
}
