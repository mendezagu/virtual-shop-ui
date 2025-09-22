import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../services/private_services/product.service';
import { StoreService } from '../../services/private_services/store.service';
import { PublicStoreService } from '../../services/public_services/publicstore.service';

import { Store } from '../../../shared/models/store.model';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TabViewModule } from 'primeng/tabview';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  count: number;
  imageUrl?: string | null;
};

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    InputTextModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    CheckboxModule,
    InputTextareaModule,
    TabViewModule,
    IconFieldModule,
    InputIconModule,
    ProgressBarModule,
    ToastModule,
    BadgeModule,
    FileUploadModule,
  ],
  providers: [MessageService, PrimeNGConfig],
})
export class ProductDialogComponent implements OnInit {
  //mesage
  messages: Message[] = [];
  productForm!: FormGroup;

  myStores: Store[] = [];
  selectedStoreId!: string;
  selectedStoreSlug = '';

  categories: CategorySummary[] = [];
  showNewCategory = false;

  // 📂 Upload
  files: (File | null)[] = [null, null, null]; // hasta 3 fotos
  preview: (string | null)[] = [null, null, null];
  totalSize = 0;
  totalSizePercent = 0;

  // Opciones de enums
  unidadOptions = [
    { label: 'Unidad', value: 'UNIDAD' },
    { label: 'Kilogramo', value: 'KILOGRAMO' },
    { label: 'Litro', value: 'LITRO' },
    { label: 'Pack', value: 'PACK' },
    { label: 'Curva', value: 'CURVA' },
    { label: 'Otro', value: 'OTRO' },
  ];

  condicionOptions = [
    { label: 'Nuevo', value: 'NUEVO' },
    { label: 'Usado', value: 'USADO' },
    { label: 'Reacondicionado', value: 'REACONDICIONADO' },
  ];

  // PrimeNG Dialog
  visible = false;

  showDialog() {
    this.visible = true;
  }

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private storeService: StoreService,
    private publicStoreService: PublicStoreService,
    private config: PrimeNGConfig,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.messages = [
      {
        severity: 'info',
        detail:
          'Agrega los detalles y características de tu productos, cuanto mas detalles brindes a tus clientes mejor sera su experiencia en tu tienda',
      },
    ];
    this.productForm = this.fb.group({
      nombre_producto: ['', Validators.required],
      categoriaSelect: ['', Validators.required],
      categoria: [''], // solo si es nueva
      descripcion: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      presentacion_multiple: [false],
      variants: this.fb.array([]),

      // Nuevos campos
      sku: [''],
      codigo_barras: [''],
      unidad_medida: ['', Validators.required],
      color: [''],
      condicion: ['NUEVO', Validators.required],
      vencimiento: [''],
      video_youtube: [''],
    });

    // Traer tiendas
    this.storeService.getMyStores().subscribe((stores) => {
      this.myStores = stores;
      if (stores.length > 0) {
        this.selectedStoreId = stores[0].id_tienda as any;
        this.selectedStoreSlug = (stores[0] as any)?.link_tienda || '';
        this.loadCategories();
      }
    });

    // Manejo de variantes
    this.productForm
      .get('presentacion_multiple')
      ?.valueChanges.subscribe((val) => {
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

  // Cargar categorías
  private loadCategories() {
    if (!this.selectedStoreSlug) return;
    this.publicStoreService.getCategories(this.selectedStoreSlug).subscribe({
      next: (res) => {
        this.categories = (res.data || []).map((c: any) => ({
          id: c.id,
          name: c.name || c.nombre || 'Sin nombre',
          slug: c.slug || c.id || c.name,
          count: c.count || 0,
          imageUrl: c.imageUrl || null,
        }));
      },
      error: (_) => {
        this.categories = [];
      },
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
      precio: [0, [Validators.required, Validators.min(0)]],
    });
    this.variants.push(variante);
  }

  quitarVariante(index: number) {
    this.variants.removeAt(index);
  }

  // Cambiar categoría
  onCategorySelectChange(value: string) {
    if (value === '__NEW__') {
      this.showNewCategory = true;
      this.productForm.get('categoriaSelect')?.clearValidators();
      this.productForm.get('categoria')?.setValidators([Validators.required]);
    } else {
      this.showNewCategory = false;
      this.productForm.get('categoria')?.clearValidators();
      this.productForm
        .get('categoriaSelect')
        ?.setValidators([Validators.required]);
    }
    this.productForm.get('categoria')?.updateValueAndValidity();
    this.productForm.get('categoriaSelect')?.updateValueAndValidity();
  }

  crearProducto() {
    if (this.productForm.invalid) return;

    const { categoriaSelect, categoria, ...payload } =
      this.productForm.getRawValue();

    // procesar categoría
    if (this.showNewCategory) {
      payload.categoria = categoria?.trim();
    } else {
      payload.categoryId = categoriaSelect;
    }

    // limpiar vencimiento vacío
    if (!payload.vencimiento) delete payload.vencimiento;

    // variantes vs stock/precio
    if (payload.presentacion_multiple) {
      delete payload.stock;
      delete payload.precio;
    } else {
      delete payload.variants;
    }

    // adjuntar archivos si existen
    if (this.files.length > 0) {
      payload.files = this.files;
    }

    this.productService.createProduct(this.selectedStoreId, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto creado correctamente',
        });
        this.visible = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el producto',
        });
      },
    });
  }

  onCancel() {
    this.visible = false;
  }

  // Manejar selección de archivo
  onFileSelect(event: any): void {
    if (event.files && event.files.length > 0) {
      for (let file of event.files) {
        this.files.push(file);

        const reader = new FileReader();
        reader.onload = () => {
          this.preview.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // Eliminar archivo
  removeFile(index: number) {
    this.files[index] = null;
    this.preview[index] = null;
  }
}
