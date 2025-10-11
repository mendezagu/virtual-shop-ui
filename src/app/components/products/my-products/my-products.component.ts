import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { Producto, ProductVariant } from '../../../shared/models/product.model';
import { ProductService } from '../../../shared/services/private_services/product.service';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { ProductDialogComponent } from '../../../shared/components/product-dialog/product-dialog.component';
import { EditProductDialogComponent } from '../../../shared/components/edit-product-dialog/edit-product-dialog.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { TextareaComponent } from '../../../shared/components/textarea/textarea.component';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// PrimeNG
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { SkeletonModule } from 'primeng/skeleton';

// Estado reactivo
import { ProductStateService } from '../../../shared/services/private_services/product-state.service';
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    // PrimeNG
    DialogModule,
    ProductDialogComponent,
    AccordionModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    InputTextareaModule,
    ToastModule,
    ConfirmDialogModule,
    SkeletonModule,
    PageHeaderComponent
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './my-products.component.html',
  styleUrls: ['./my-products.component.scss'],
})
export class MyProductsComponent implements OnInit {
  @ViewChild('accordion') accordion: any;

  /** Estado reactivo */
  products$ = this.productState.products$;
  categories$ = this.productState.categories$;

  /** UI */
  disabledFields = true;
  isLoading = true;

  totalItems = 0;
  pageSize = 5;
  currentPage = 0;

  currentStoreSlug?: string;
  currentStoreId?: string;

  searchCtrl = new FormControl<string>('', { nonNullable: true });

  selectedProduct?: Producto;
  editVisible = false;
  createVisible = false;

  constructor(
    private productService: ProductService,
    private storeService: StoreService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private productState: ProductStateService
  ) {}

ngOnInit(): void {
    /** 🔹 Cargar tienda del usuario solo una vez */
    this.storeService.getMyPrimaryStore().subscribe((store) => {
      if (store) {
        this.currentStoreSlug = store.link_tienda;
        this.currentStoreId = store.id_tienda;

        // Inicializar estado reactivo global
        this.productState.init(store.id_tienda, store.link_tienda);
        this.isLoading = false;
      }
    });

    /** 🔹 Búsqueda reactiva */
    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.productState.setSearch(term);
      });
  }

  /** Mantiene la carga tradicional (retrocompatibilidad con tu template actual) */


  /** ========================
   * 🔸 Diálogos y Acciones CRUD
   * ======================== */
 /** CRUD */
  openCreateDialog() {
    this.createVisible = true;
  }

  openEditDialog(product: Producto) {
    this.selectedProduct = product;
    this.editVisible = true;
  }

 onDeleteProduct(productId: string) {
    this.confirmationService.confirm({
      message: '¿Deseas eliminar este producto?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'El producto fue eliminado correctamente.',
            });
            this.productState.deleteProduct(productId);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el producto.',
            });
          },
        });
      },
    });
  }

  /** ========================
   * 🔸 Paginación
   * ======================== */
  onPageChange(event: any) {
    this.pageSize = event.rows;
    this.currentPage = event.page;
    this.productState.setPage(event.page + 1);
  }

  /** ========================
   * 🔸 Utilidades visuales
   * ======================== */
getTotalStock(product: Producto): number {
    if (product.presentacion_multiple && product.variants?.length) {
      return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return product.stock || 0;
  }

getMinPrice(product: Producto): number {
    if (product.presentacion_multiple && product.variants?.length) {
      return Math.min(...product.variants.map((v) => v.precio || 0));
    }
    return product.precio || 0;
  }

  updateVariantStock(
    product: Producto,
    variant: ProductVariant,
    value: number
  ) {
    variant.stock = value;
    if (product.presentacion_multiple) {
      product.stock = this.getTotalStock(product);
    }
  }

  uploadImage(product: any, index: number) {
    console.log('Subir imagen para', product.nombre_producto, 'slot', index);
  }

  removeImage(product: any, index: number) {
    if (product.imagen_url) {
      product.imagen_url.splice(index, 1);
    }
  }

  trackByProduct(index: number, product: Producto): string {
    return product.id_producto;
  }

  trackByVariant(index: number, variant: ProductVariant): string {
    return variant.id_variant || variant.nombre;
  }
}
