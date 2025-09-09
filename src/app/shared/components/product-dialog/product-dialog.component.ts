import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgIf, NgForOf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ProductService } from '../../services/private_services/product.service';
import { StoreService } from '../../services/private_services/store.service';
import { PublicStoreService } from '../../services/public_services/publicstore.service';

import { Store } from '../../../shared/models/store.model';
import { InputComponent } from '../input/input.component';
import { TextareaComponent } from "../textarea/textarea.component";

type CategorySummary = { name: string; slug: string; count: number; imageUrl?: string | null };

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogActions,
    InputComponent,
    TextareaComponent,
    MatCheckbox,
    MatButtonModule,
    NgIf,
    NgForOf,
    MatSelectModule,
    MatFormFieldModule
  ]
})
export class ProductDialogComponent implements OnInit {
  productForm!: FormGroup;

  myStores: Store[] = [];
  selectedStoreId!: string;
  selectedStoreSlug = '';

  categories: CategorySummary[] = [];
  showNewCategory = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private storeService: StoreService,
    private publicStoreService: PublicStoreService,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.productForm = this.fb.group({
      nombre_producto: ['', Validators.required],

      // Select visual
      categoriaSelect: [''],

      // Valor real que enviamos al backend
      categoria: ['', Validators.required],

      grupo: ['', Validators.required],
      descripcion: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      presentacion_multiple: [false],
      variants: this.fb.array([])
    });

    // Obtener tiendas del usuario y usar la primera
    this.storeService.getMyStores().subscribe(stores => {
      this.myStores = stores;
      if (stores.length > 0) {
        this.selectedStoreId = stores[0].id_tienda as any;
        // Asegurate de exponer link_tienda en tu API de stores
        this.selectedStoreSlug = (stores[0] as any)?.link_tienda || '';
        this.loadCategories();
      }
    });

    // Manejo de variantes
    this.productForm.get('presentacion_multiple')?.valueChanges.subscribe(val => {
      if (val) {
        this.productForm.get('stock')?.disable();
        this.productForm.get('precio')?.disable();
        if (this.variants.length === 0) this.agregarVariante();
      } else {
        this.productForm.get('stock')?.enable();
        this.productForm.get('precio')?.enable();
        this.variants.clear();
      }
    });
  }

  // Variantes
  get variants() {
    return this.productForm.get('variants') as FormArray;
  }

  agregarVariante() {
    const variante = this.fb.group({
      nombre: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]]
    });
    this.variants.push(variante);
  }

  quitarVariante(index: number) {
    this.variants.removeAt(index);
  }

  // Categorías
  private loadCategories() {
    if (!this.selectedStoreSlug) return;
    this.publicStoreService.getCategories(this.selectedStoreSlug).subscribe({
      next: res => { this.categories = res.data || []; },
      error: _ => { this.categories = []; }
    });
  }

  onCategorySelectChange(value: string) {
    if (value === '__NEW__') {
      this.showNewCategory = true;
      this.productForm.get('categoria')!.reset('');
      this.productForm.get('categoria')!.markAsTouched();
    } else {
      this.showNewCategory = false;
      this.productForm.get('categoria')!.setValue(value);
    }
  }

crearProducto() {
  // Si eligió "nueva" pero no escribió nada
  if (this.showNewCategory && !this.productForm.get('categoria')!.value) {
    this.productForm.get('categoria')!.markAsTouched();
    return;
  }
  if (this.productForm.invalid) return;

  // ✅ getRawValue incluye los campos deshabilitados; extraemos y eliminamos categoriaSelect
  const { categoriaSelect, ...payload } = this.productForm.getRawValue() as any;

  // Normaliza categoría (opcional)
  if (payload.categoria) payload.categoria = String(payload.categoria).trim();

  // Si usa variantes, no mandes stock/precio principales
  if (payload.presentacion_multiple) {
    delete payload.stock;
    delete payload.precio;
    // Si no hay variantes, podrías validar aquí
  } else {
    // Si NO usa variantes, no mandes 'variants'
    delete payload.variants;
  }

  this.productService.createProduct(this.selectedStoreId, payload).subscribe({
    next: () => {
      alert('Producto creado correctamente');
      this.dialogRef.close(true);
    },
    error: (err) => {
      console.error(err);
      alert('Error al crear producto');
    },
  });
}

  onCancel() {
    this.dialogRef.close(false);
  }
}
