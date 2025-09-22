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
    InputComponent,
    TextareaComponent,
  ],
  templateUrl: './my-products.component.html',
  styleUrls: ['./my-products.component.scss'],
})
export class MyProductsComponent implements OnInit {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  disabledFields = true;
  isLoading = true;

  productos: Producto[] = [];

  totalItems = 0;
  pageSize = 5;
  currentPage = 0;

  /** 👇 Guardamos el slug público de la tienda para pasarlo al diálogo */
  currentStoreSlug?: string;

  searchCtrl = new FormControl<string>('', { nonNullable: true });

  constructor(
    private productService: ProductService,
    private storeService: StoreService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts(this.currentPage, this.pageSize);

    // 🔎 Búsqueda con debounce
    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.currentPage = 0;
        this.loadProducts(this.currentPage, this.pageSize, term || '');
      });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '420px',
      data: { title: 'Agregar producto', message: 'Completa los datos del nuevo producto.' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // crea y refresca
        this.storeService.getMyStores().subscribe({
          next: (stores) => {
            const idTienda = stores?.[0]?.id_tienda;
            if (!idTienda) return;
            this.productService.createProduct(idTienda, result).subscribe({
              next: () =>
                this.loadProducts(
                  this.currentPage,
                  this.pageSize,
                  this.searchCtrl.value || ''
                ),
            });
          },
        });
      }
    });
  }

  /** 👇 Ahora acepta slug opcional, pero si lo tenemos guardado lo pasamos */
  openEditDialog(product: Producto, storeSlug?: string) {
    const deducedSlug =
      storeSlug ||
      this.currentStoreSlug ||
      // si el producto viene de un findOne con store:
      (product as any)?.store?.link_tienda ||
      undefined;

    const dialogRef = this.dialog.open(EditProductDialogComponent, {
      width: '520px',
      data: deducedSlug ? { product, storeSlug: deducedSlug } : { product },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.productService.updateProduct(product.id_producto, result).subscribe({
          next: () =>
            this.loadProducts(
              this.currentPage,
              this.pageSize,
              this.searchCtrl.value || ''
            ),
          error: (err) => console.error('Error al actualizar', err),
        });
      }
    });
  }

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

  updateVariantStock(product: Producto, variant: ProductVariant, value: number) {
    variant.stock = value;
    if (product.presentacion_multiple) {
      product.stock = this.getTotalStock(product);
    }
  }

  loadProducts(page: number = 0, limit: number = this.pageSize, search: string = '') {
    this.isLoading = true;

    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        const store = stores?.[0];
        const idTienda = store?.id_tienda;

        // 👇 guardamos el slug público para el diálogo
        this.currentStoreSlug = store?.link_tienda;

        if (!idTienda) {
          this.productos = [];
          this.totalItems = 0;
          this.isLoading = false;
          return;
        }

        this.productService
          .getProductsByStore(idTienda, page + 1, limit, search)
          .subscribe({
            next: (res) => {
              this.productos = res.data;
              this.totalItems = res.meta?.total ?? res.data?.length ?? 0;
              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
            },
          });
      },
      error: () => (this.isLoading = false),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadProducts(this.currentPage, this.pageSize, this.searchCtrl.value || '');
  }

  uploadImage(product: any, index: number) {
  // Aquí podés abrir un file picker o tu modal de subida
  console.log("Subir imagen para", product.nombre_producto, "slot", index);
}

removeImage(product: any, index: number) {
  if (product.imagen_url) {
    product.imagen_url.splice(index, 1);
  }
}
}
