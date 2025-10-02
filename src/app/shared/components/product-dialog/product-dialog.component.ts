import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
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
import { Producto } from '../../../shared/models/product.model';

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
import { UploadService } from '../../services/private_services/upload.service';

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
export class ProductDialogComponent implements OnInit, OnChanges {
  // Inputs para reutilizar en crear/editar
  @Input() product?: Producto;
  @Input() storeId?: string;

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  // UI
  //visible = false;
  messages: Message[] = [];
  showNewCategory = false;

  // Formulario
  productForm!: FormGroup;

  myStores: Store[] = [];
  selectedStoreId!: string;
  selectedStoreSlug = '';

  categories: CategorySummary[] = [];

  // 📂 Upload
  files: (File | null)[] = [null, null, null];
  preview: (string | null)[] = [null, null, null];
  totalSize = 0;
  totalSizePercent = 0;

  // Opciones enums
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

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private storeService: StoreService,
    private publicStoreService: PublicStoreService,
    private config: PrimeNGConfig,
    private messageService: MessageService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {
    this.initForm();

    this.messages = [
      {
        severity: 'info',
        detail:
          'Agrega o edita los detalles de tu producto. Mientras más detalles brindes, mejor será la experiencia de tus clientes.',
      },
    ];

    if (this.product) {
      this.patchForm(this.product);
    }

    this.storeService.getMyStores().subscribe((stores) => {
      this.myStores = stores;
      if (stores.length > 0) {
        this.selectedStoreId = stores[0].id_tienda as any;
        this.selectedStoreSlug = (stores[0] as any)?.link_tienda || '';
        this.loadCategories();
      }
    });

    this.productForm
      .get('presentacion_multiple')
      ?.valueChanges.subscribe((val) => {
        if (val) {
          this.productForm.get('stock')?.disable();
          this.productForm.get('precio')?.disable();

          // 👉 solo al activar, agrego una variante si está vacío
          if (this.variants.length === 0) {
            this.agregarVariante();
          }
        } else {
          this.productForm.get('stock')?.enable();
          this.productForm.get('precio')?.enable();
          this.variants.clear();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && changes['product'].currentValue) {
      this.patchForm(changes['product'].currentValue);
    }
  }

  private initForm() {
    this.productForm = this.fb.group({
      nombre_producto: ['', Validators.required],
      categoriaSelect: ['', Validators.required],
      categoria: [''],
      descripcion: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      presentacion_multiple: [false],
      variants: this.fb.array([]),
      sku: [''],
      codigo_barras: [''],
      unidad_medida: ['', Validators.required],
      color: [''],
      condicion: ['NUEVO', Validators.required],
      vencimiento: [''],
      video_youtube: [''],
    });
  }

  private patchForm(product: Producto) {
    let categoryId = (product as any).categoryId || '';

    // fallback: si no tiene categoryId pero sí un nombre viejo
    if (!categoryId && product.category?.name) {
      const match = this.categories.find(
        (c) => c.name === product.category?.name
      );
      if (match) categoryId = match.id;
    }

    this.productForm.patchValue({
      nombre_producto: product.nombre_producto,
      categoriaSelect: categoryId,
      categoria: product.category?.name || '',
      descripcion: product.descripcion,
      stock: product.stock,
      precio: product.precio,
      presentacion_multiple: product.presentacion_multiple,
      sku: (product as any).sku || '',
      codigo_barras: (product as any).codigo_barras || '',
      unidad_medida: (product as any).unidad_medida || '',
      color: (product as any).color || '',
      condicion: (product as any).condicion || 'NUEVO',
      vencimiento: product.vencimiento
        ? new Date(product.vencimiento).toISOString().substring(0, 10)
        : '',
      video_youtube: (product as any).video_youtube || '',
    });

    if (product.variants?.length) {
      this.variants.clear(); // 🔑 para no duplicar
      product.variants.forEach((v) =>
        this.variants.push(
          this.fb.group({
            nombre: [v.nombre, Validators.required],
            stock: [v.stock, [Validators.required, Validators.min(0)]],
            precio: [v.precio, [Validators.required, Validators.min(0)]],
          })
        )
      );
    }
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

  // Categorías
  private loadCategories() {
    if (!this.selectedStoreSlug) return;
    this.publicStoreService.getCategories(this.selectedStoreSlug).subscribe({
      next: (res) => {
        this.categories = (res.data || []).map((c: any) => ({
          id: c.id, // 👈 usamos slug como id
          name: c.name || c.nombre || 'Sin nombre',
          slug: c.slug,
          count: c.count || 0,
          imageUrl: c.imageUrl || null,
        }));
      },
      error: (_) => {
        this.categories = [];
      },
    });
  }

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

  // CREAR o EDITAR
  submit() {
    if (this.productForm.invalid) return;

    const { categoriaSelect, categoria, ...payload } =
      this.productForm.getRawValue();

    // 🖼️ Guardar URLs de imágenes
    const uploadedImages = this.preview.filter((url) => url !== null);
    if (uploadedImages.length > 0) {
      payload.imagen_url = uploadedImages;
    }

    if (this.showNewCategory) {
      payload.categoria = categoria?.trim();
      delete payload.categoryId;
    } else {
      payload.categoryId = categoriaSelect;
    }

    if (payload.vencimiento) {
      payload.vencimiento = new Date(payload.vencimiento).toISOString();
    } else {
      delete payload.vencimiento;
    }
    if (payload.presentacion_multiple) {
      delete payload.stock;
      delete payload.precio;
    } else {
      delete payload.variants;
    }

    /*if (this.files.length > 0) {
      payload.files = this.files;
    }*/

    if (this.product) {
      // EDITAR
      this.productService
        .updateProduct(this.product.id_producto, payload)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Producto actualizado correctamente',
            });
            this.visible = false;
            this.visibleChange.emit(this.visible);
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar el producto',
            });
          },
        });
    } else {
      // CREAR
      this.productService
        .createProduct(this.selectedStoreId, payload)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Producto creado correctamente',
            });
            this.visible = false;
            this.visibleChange.emit(this.visible);
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
  }

  handleHide() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  onCancel() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }
  // Manejo de archivos
async onFileSelect(event: any): Promise<void> {
  if (event.files && event.files.length > 0) {
    for (let file of event.files) {
      try {
        const uploadedUrl = await this.uploadService.uploadFilePresigned(file, 'products');
        // guardás directamente la URL pública en el array preview
        const idx = this.preview.findIndex(p => p === null);
        if (idx !== -1) {
          this.preview[idx] = uploadedUrl;
        }
      } catch (err) {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al subir',
          detail: `No se pudo subir ${file.name}`,
        });
      }
    }
  }
}

  removeFile(index: number) {
    this.files[index] = null;
    this.preview[index] = null;
  }
}
