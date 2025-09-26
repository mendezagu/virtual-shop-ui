import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
} from '@angular/material/dialog';
import { Producto, ProductVariant } from '../../models/product.model';
import { InputComponent } from '../input/input.component';
import { TextareaComponent } from '../textarea/textarea.component';
import { MatSelectModule } from '@angular/material/select';
import { PublicStoreService } from '../../services/public_services/publicstore.service';

type CategoryOption = { name: string; slug: string; count: number; imageUrl?: string | null };

@Component({
  selector: 'app-edit-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogContent,
    InputComponent,
    TextareaComponent,
    MatSelectModule,
  ],
  templateUrl: './edit-product-dialog.component.html',
  styleUrl: './edit-product-dialog.component.scss',
})
export class EditProductDialogComponent implements OnInit {
  form!: FormGroup;
  categories: CategoryOption[] = [];
  showNewCategory = false;

  get variantsFormArray(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private publicStoreService: PublicStoreService,
    public dialogRef: MatDialogRef<EditProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { product: Producto; storeSlug?: string }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre_producto: [this.data.product.nombre_producto, Validators.required],
      // `categoria` es el valor que se envía al backend
      categoria: [this.data.product.category?.name ?? '', Validators.required],
      // `categoriaSelect` sólo maneja el UI del mat-select (NO se envía al backend)
      categoriaSelect: [''],
      grupo: [this.data.product.grupo, Validators.required],
      descripcion: [this.data.product.descripcion],
      stock: [this.data.product.stock, [Validators.required, Validators.min(0)]],
      precio: [this.data.product.precio, [Validators.required, Validators.min(0)]],
      variants: this.fb.array([]),
    });

    if (this.data.product.presentacion_multiple && this.data.product.variants) {
      this.data.product.variants.forEach((variant: ProductVariant) => {
        this.variantsFormArray.push(
          this.fb.group({
            id_variant: [variant.id_variant],
            nombre: [variant.nombre, Validators.required],
            stock: [variant.stock, [Validators.required, Validators.min(0)]],
            precio: [variant.precio, [Validators.required, Validators.min(0)]],
          })
        );
      });
    }

    this.loadCategoriesAndInitSelect();
  }

  /** Carga categorías de la tienda (usando slug) y configura el select */
  private loadCategoriesAndInitSelect() {
    // 1) Preferimos el slug pasado por data; 2) si el producto trae store.link_tienda, también sirve
    const slug =
      this.data?.storeSlug ||
      // @ts-ignore (si tu Producto de findOne incluye store.link_tienda)
      (this.data?.product as any)?.store?.link_tienda;

    if (!slug) {
      // Sin slug no podemos pedir categorías: dejamos input de texto
      this.showNewCategory = true;
      this.form.get('categoriaSelect')!.setValue('__NEW__', { emitEvent: false });
      return;
    }

    this.publicStoreService.getCategories(slug).subscribe({
      next: (res) => {
        this.categories = res?.data ?? [];

        // Si el producto ya tiene categoría, seleccionarla si existe
        const current = String(this.form.get('categoria')!.value || '').trim();
        const match = this.categories.find(
          (c) => c.name.toLowerCase() === current.toLowerCase()
        );

        if (match) {
          this.showNewCategory = false;
          this.form.get('categoriaSelect')!.setValue(match.name, { emitEvent: false });
          this.form.get('categoria')!.setValue(match.name);
        } else {
          this.showNewCategory = true;
          this.form.get('categoriaSelect')!.setValue('__NEW__', { emitEvent: false });
        }

        // Suscribir cambios del select
        this.form.get('categoriaSelect')!.valueChanges.subscribe((val) =>
          this.onCategorySelectChange(val)
        );
      },
      error: () => {
        // Si falla el fetch, dejamos input libre
        this.showNewCategory = true;
        this.form.get('categoriaSelect')!.setValue('__NEW__', { emitEvent: false });
      },
    });
  }

  onCategorySelectChange(value: string) {
    if (value === '__NEW__') {
      this.showNewCategory = true;
      this.form.get('categoria')!.reset('');
      this.form.get('categoria')!.markAsTouched();
    } else {
      this.showNewCategory = false;
      this.form.get('categoria')!.setValue(value);
    }
  }

  save() {
    if (this.form.invalid) return;

    // No enviamos el campo de UI
    const { categoriaSelect, ...payload } = this.form.getRawValue();

    // Normalizar
    if (payload.categoria) {
      payload.categoria = String(payload.categoria).trim();
    }

    this.dialogRef.close(payload);
  }

  close() {
    this.dialogRef.close();
  }
}
