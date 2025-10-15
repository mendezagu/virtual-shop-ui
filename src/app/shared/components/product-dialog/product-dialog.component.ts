import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
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
import { InputNumberModule } from 'primeng/inputnumber';
import { ProductStateService } from '../../services/private_services/product-state.service';


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
    InputNumberModule,
  ],
  providers: [MessageService, PrimeNGConfig],
})
export class ProductDialogComponent implements OnInit, OnChanges {
  @Input() product?: Producto;
  @Input() storeId?: string;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  messages: Message[] = [];
  showNewCategory = false;

  productForm!: FormGroup;
  myStores: Store[] = [];
  selectedStoreId!: string;
  selectedStoreSlug = '';

  categories: CategorySummary[] = [];

  files: (File | null)[] = [null, null, null];
  preview: (string | null)[] = [null, null, null];
  totalSize = 0;
  totalSizePercent = 0;

  @ViewChild('slotFileInput') slotFileInput!: ElementRef<HTMLInputElement>;
  private slotToEdit: number | null = null;

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
    private config: PrimeNGConfig,
    private messageService: MessageService,
    private uploadService: UploadService,
    private productState: ProductStateService
    // ✅ Nuevo
    
  ) {}

  get hasPreview(): boolean {
    return this.preview.some((u) => !!u);
  }

  private setInitialPreview(product?: Producto) {
    const imgs = product?.imagen_url ?? [];
    this.preview = [imgs[0] ?? null, imgs[1] ?? null, imgs[2] ?? null];
    this.files = [null, null, null];
  }

  ngOnInit() {
    this.initForm();

    this.productForm.get('precio')?.valueChanges.subscribe(() => this.updateGananciaYPrecioFinal());
    this.productForm.get('costo')?.valueChanges.subscribe(() => this.updateGananciaYPrecioFinal());
    this.productForm.get('descuento')?.valueChanges.subscribe(() => this.updateGananciaYPrecioFinal());

    this.messages = [
      {
        severity: 'info',
        detail:
          'Agrega o edita los detalles de tu producto. Mientras más detalles brindes, mejor será la experiencia de tus clientes.',
      },
    ];

    if (this.product) {
      this.setInitialPreview(this.product);
      this.patchForm(this.product);
    }

    // ✅ Ya no llamamos a getMyStores ni loadCategories
    // En lugar de eso, usamos el estado compartido:
    this.productState.categories$.subscribe((cats) => {
      if (cats) {
        this.categories = cats.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c.count || 0,
          imageUrl: c.imageUrl || null,
        }));
      }
    });

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) {
      const p: Producto | undefined = changes['product'].currentValue;
      if (p) {
        this.patchForm(p);
        this.setInitialPreview(p);
      } else {
        this.preview = [null, null, null];
        this.files = [null, null, null];
      }
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
      costo: [''],
      descuento: [''],
      ganancia: [''],
      precio_final: [''],
      precio_mayorista: [''],
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

  private updateGananciaYPrecioFinal(): void {
    const precio = Number(this.productForm.get('precio')?.value) || 0;
    const costo = Number(this.productForm.get('costo')?.value) || 0;
    const descuento = Number(this.productForm.get('descuento')?.value) || 0;

    if (!precio) {
      this.productForm.patchValue({ ganancia: 0, precio_final: 0 }, { emitEvent: false });
      return;
    }

    const descuentoAplicado = precio * (descuento / 100);
    const precioFinal = precio - descuentoAplicado;
    const ganancia = precioFinal - costo;

    this.productForm.patchValue({ ganancia, precio_final: precioFinal }, { emitEvent: false });
  }

  private patchForm(product: Producto) {
    let categoryId = (product as any).categoryId || '';

    if (!categoryId && product.category?.name) {
      const match = this.categories.find((c) => c.name === product.category?.name);
      if (match) categoryId = match.id;
    }

    this.productForm.patchValue({
      nombre_producto: product.nombre_producto,
      categoriaSelect: categoryId,
      categoria: product.category?.name || '',
      descripcion: product.descripcion,
      stock: product.stock,
      precio: product.precio,
      costo: product.costo,
      descuento: product.descuento,
      ganancia: product.ganancia,
      precio_final: product.precio_final,
      precio_mayorista: product.precio_mayorista,
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
      this.variants.clear();
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

  onCategorySelectChange(value: string) {
    if (value === '__NEW__') {
      this.showNewCategory = true;
      this.productForm.get('categoriaSelect')?.clearValidators();
      this.productForm.get('categoria')?.setValidators([Validators.required]);
    } else {
      this.showNewCategory = false;
      this.productForm.get('categoria')?.clearValidators();
      this.productForm.get('categoriaSelect')?.setValidators([Validators.required]);
    }
    this.productForm.get('categoria')?.updateValueAndValidity();
    this.productForm.get('categoriaSelect')?.updateValueAndValidity();
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
    if (!event?.files?.length) return;

    for (const file of event.files as File[]) {
      const nextIndex = this.preview.findIndex((p) => p === null);
      if (nextIndex === -1) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Solo puedes subir hasta 3 imágenes',
        });
        break;
      }
      try {
        const url = await this.uploadService.uploadFilePresigned(
          file,
          'products'
        );
        this.files[nextIndex] = file;
        this.preview[nextIndex] = url;
      } catch {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al subir',
          detail: `No se pudo subir ${file.name}`,
        });
      }
    }
  }

  editSlot(i: number) {
    this.slotToEdit = i;
    if (this.slotFileInput) {
      this.slotFileInput.nativeElement.value = '';
      this.slotFileInput.nativeElement.click();
    }
  }

  async onSlotFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.slotToEdit === null) return;

    try {
      const url = await this.uploadService.uploadFilePresigned(
        file,
        'products'
      );
      this.files[this.slotToEdit] = file;
      this.preview[this.slotToEdit] = url;
    } finally {
      this.slotToEdit = null;
      input.value = '';
    }
  }

  removeFile(index: number) {
    this.files[index] = null;
    this.preview[index] = null;
  }
  async replaceImage(event: any, idx: number) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const url = await this.uploadService.uploadFilePresigned(
        file,
        'products'
      );
      this.preview[idx] = url; // reemplaza solo esta posición
    } catch (err) {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error al subir',
        detail: `No se pudo subir ${file.name}`,
      });
    }
  }

  // CREAR o EDITAR
submit() {
  if (this.productForm.invalid) return;

  const { categoriaSelect, categoria, ...payload } = this.productForm.getRawValue();

  // 🖼️ Unimos imágenes existentes + nuevas
  const images = this.preview.filter((u): u is string => !!u);
  if (images.length) payload.imagen_url = images;
  else delete payload.imagen_url;

  // 🏷️ Categoría
  if (this.showNewCategory) {
    payload.categoria = categoria?.trim();
    delete payload.categoryId;
  } else {
    payload.categoryId = categoriaSelect;
  }

  // 🗓️ Fecha
  if (payload.vencimiento) {
    payload.vencimiento = new Date(payload.vencimiento).toISOString();
  } else {
    delete payload.vencimiento;
  }

  // 📦 Variantes vs simple
  if (payload.presentacion_multiple) {
    delete payload.stock;
    delete payload.precio;
  } else {
    delete payload.variants;
  }

  // ⚙️ Obtener la tienda activa desde el estado global
  const storeId = (this as any).productState['storeId'];
  console.log('🟢 ID de tienda usada para crear producto:', storeId);

  if (!storeId) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se encontró la tienda activa. Vuelve a cargar tu panel.',
    });
    return;
  }

  // 🔹 Limpiar valores numéricos vacíos o inválidos
  ['descuento', 'precio_mayorista', 'costo', 'ganancia', 'precio_final'].forEach((campo) => {
    if (
      payload[campo] === '' ||
      payload[campo] === null ||
      payload[campo] === undefined ||
      isNaN(Number(payload[campo]))
    ) {
      delete payload[campo];
    } else {
      payload[campo] = Number(payload[campo]);
    }
  });

  // ✳️ Si es edición
  if (this.product) {
    this.productService.updateProduct(this.product.id_producto, payload).subscribe({
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
          detail: err?.error?.message || 'No se pudo actualizar el producto',
        });
      },
    });
  } else {
    // ✳️ CREACIÓN
    this.productService.createProduct(storeId, payload).subscribe({
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
        console.error('❌ Error al crear producto:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo crear el producto',
        });
      },
    });
  }
}

}
