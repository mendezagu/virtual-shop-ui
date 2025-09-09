import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

import { ProductService } from '../../../shared/services/private_services/product.service';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { PublicStoreService } from '../../../shared/services/public_services/publicstore.service';
import { Store } from '../../../shared/models/store.model';

type CategorySummary = { name: string; slug: string; count: number; imageUrl?: string | null };

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckbox,
    MatSelectModule
  ],
  templateUrl: './create-product.component.html',
  styleUrl: './create-product.component.scss'
})
export class CreateProductComponent {
  productForm!: FormGroup;

  myStores: Store[] = [];
  selectedStoreId!: string;
  selectedStoreSlug = '';

  categories: CategorySummary[] = [];
  showNewCategory = false; // controla si mostramos el input "Nueva categoría"

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private storeService: StoreService,
    private publicStoreService: PublicStoreService
  ) {}

  ngOnInit() {
    this.productForm = this.fb.group({
      nombre_producto: ['', Validators.required],

      // Select de categorías (solo para la UI)
      categoriaSelect: [''],

      // Valor real que enviamos al backend (sea existente o nueva)
      categoria: ['', Validators.required],

      grupo: ['', Validators.required],
      descripcion: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      presentacion_multiple: [false],
      variants: this.fb.array([])
    });

    // Obtener tiendas del usuario y seleccionar la primera
    this.storeService.getMyStores().subscribe(stores => {
      this.myStores = stores;
      if (stores.length > 0) {
        this.selectedStoreId = stores[0].id_tienda;
        this.selectedStoreSlug = (stores[0] as any)?.link_tienda || ''; // asegúrate de exponer link_tienda en tu API
        this.loadCategories();
      }
    });

    // Si tiene variantes, deshabilitar stock y precio
    this.productForm.get('presentacion_multiple')?.valueChanges.subscribe(val => {
      if (val) {
        this.productForm.get('stock')?.disable();
        this.productForm.get('precio')?.disable();
      } else {
        this.productForm.get('stock')?.enable();
        this.productForm.get('precio')?.enable();
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
      // Mostrar input para nueva categoría (y limpiar valor real)
      this.showNewCategory = true;
      this.productForm.get('categoria')!.reset('');
      this.productForm.get('categoria')!.markAsTouched();
    } else {
      // Tomar el nombre de una existente y ocultar input
      this.showNewCategory = false;
      this.productForm.get('categoria')!.setValue(value);
    }
  }

  crearProducto() {
    if (this.productForm.invalid) return;

    const payload = this.productForm.value;
    // payload.categoria ya contiene:
    //  - el nombre de la categoría elegida (existente), o
    //  - el texto escrito si eligió “+ Crear nueva categoría”
    this.productService.createProduct(this.selectedStoreId, payload).subscribe({
      next: _ => {
        alert('Producto creado correctamente');
        this.productForm.reset();
        this.variants.clear();
        this.showNewCategory = false;
        // recargar categorías por si se creó una nueva
        this.loadCategories();
      },
      error: err => {
        console.error(err);
        alert('Error al crear producto');
      }
    });
  }
}
