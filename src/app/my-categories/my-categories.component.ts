import { Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

import { StoreService } from '../shared/services/private_services/store.service';
import { PublicStoreService } from '../shared/services/public_services/publicstore.service';
import { ProductService } from '../shared/services/private_services/product.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Producto } from '../shared/models/product.model';
import { CategoryService } from '../shared/services/private_services/category.service';
import { InputComponent } from '../shared/components/input/input.component';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
//PRIMENG 
import { AccordionModule } from 'primeng/accordion';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

export interface CategorySummary {
  id: string; // 👈 nuevo
  name: string;
  slug: string;
  count: number;
  imageUrl?: string | null;
  products?: Producto[];
  loading?: boolean;
}

@Component({
  selector: 'app-my-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatFormFieldModule,
    MatOptionModule,
//primeng
    AccordionModule,
    AvatarModule,
    BadgeModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './my-categories.component.html',
  styleUrls: ['./my-categories.component.scss'],
})
export class MyCategoriesComponent implements OnInit {
  categories: any[] = [];
  slug = '';
  isLoading = true;
  hasError = false;
  categoryForms: { [slug: string]: FormGroup } = {};
  newCategoryForm!: FormGroup;

  searchCtrl = new FormControl('');
  storeId = ''; // ⚡ para endpoints privados
  storeSlug = '';

  constructor(
    private storeService: StoreService,
    private publicStoreService: PublicStoreService,
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.newCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });

    // 1. Traer las tiendas del usuario
    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores?.length > 0) {
          this.storeId = stores[0].id_tienda;
          this.storeSlug = stores[0].link_tienda;
          this.loadCategories();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

loadCategories(page: number = 1, limit: number = 10) {
  if (!this.storeSlug) return;

  this.categoryService.getCategories(this.storeSlug, page, limit).subscribe({
    next: (res) => {
      console.log('categorías recibidas', res);

      this.categories = Array.isArray(res.data) ? res.data : [];

      // Generar formularios de edición para cada categoría
      this.categories.forEach((c) => {
        this.categoryForms[c.id] = this.fb.group({
          name: [c.name, [Validators.required, Validators.minLength(2)]],
        });
      });

      // ⚡ Podés usar esta metadata para armar paginador
      const { total, totalPages } = res.meta;
      console.log(`Página ${page} de ${totalPages}, total categorías: ${total}`);

      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error cargando categorías:', err);
      this.isLoading = false;
      this.hasError = true;
      this.categories = [];
    },
  });
}


  loadProducts(category: CategorySummary) {
    if (!this.storeSlug) return;
    if (category.products) return; // ya cargados
    category.loading = true;

    this.publicStoreService
      .getProductsByCategory(this.storeSlug, category.slug, 1, 20)
      .subscribe({
        next: (res) => {
          category.products = res.data || [];
          category.loading = false;
        },
        error: () => {
          category.products = [];
          category.loading = false;
        },
      });
  }

createCategory() {
  if (this.newCategoryForm.invalid) return;
  const name = this.newCategoryForm.value.name;

  this.confirmationService.confirm({
    message: `¿Quieres crear la categoría "${name}"?`,
    header: 'Confirmar creación',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Sí, crear',
    rejectLabel: 'Cancelar',
    acceptButtonStyleClass: 'p-button-success p-button-sm',
    rejectButtonStyleClass: 'p-button-text p-button-sm',
    accept: () => {
      this.categoryService.createCategory(this.storeId, name).subscribe({
        next: (cat) => {
          this.categories.push({ ...cat, count: 0, products: [] });
          this.newCategoryForm.reset();
          this.messageService.add({
            severity: 'success',
            summary: 'Categoría creada',
            detail: `"${cat.name}" fue creada exitosamente.`,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la categoría.',
          });
        },
      });
    }
  });
}

updateCategory(c: CategorySummary) {
  const form = this.categoryForms[c.id];
  if (!form?.valid) return;

  this.categoryService.updateCategory(c.id, form.value.name).subscribe({
    next: () => {
      c.name = form.value.name;
      this.messageService.add({
        severity: 'success',
        summary: 'Categoría actualizada',
        detail: `"${c.name}" se actualizó correctamente.`,
      });
    },
    error: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la categoría.',
      });
    }
  });
}

deleteCategory(c: CategorySummary) {
  this.confirmationService.confirm({
    message: `¿Seguro que quieres eliminar la categoría "${c.name}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptButtonStyleClass: 'p-button-danger p-button-sm',
    rejectButtonStyleClass: 'p-button-text p-button-sm',
    accept: () => {
      this.categoryService.deleteCategory(c.id).subscribe({
        next: () => {
          this.categories = this.categories.filter((cat) => cat.id !== c.id);
          this.messageService.add({
            severity: 'warn',
            summary: 'Categoría eliminada',
            detail: `"${c.name}" fue eliminada.`,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la categoría.',
          });
        },
      });
    }
  });
}

  onCategoryMenuAction(action: string, c: CategorySummary) {
    if (action === 'delete') {
      this.deleteCategory(c);
    }
  }
}
