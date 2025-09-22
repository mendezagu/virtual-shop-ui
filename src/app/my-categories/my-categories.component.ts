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
    InputComponent,
    MatMenuModule,
    MatFormFieldModule,
    MatOptionModule,
  ],
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
    private categoryService: CategoryService
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
  loadCategories() {
    if (!this.storeSlug) return;

    this.productService.getCategories(this.storeSlug).subscribe({
      next: (res) => {
        this.categories = res.data;
        this.categories.forEach((c) => {
          this.categoryForms[c.id] = this.fb.group({
            name: [c.name, [Validators.required, Validators.minLength(2)]],
          });
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
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

    this.categoryService.createCategory(this.storeId, name).subscribe({
      next: (cat) => {
        this.categories.push({ ...cat, count: 0, products: [] });
        this.newCategoryForm.reset();
      },
    });
  }

  updateCategory(c: CategorySummary) {
    const form = this.categoryForms[c.id];
    if (!form?.valid) return;

    this.categoryService.updateCategory(c.id, form.value.name).subscribe({
      next: () => (c.name = form.value.name),
    });
  }

  deleteCategory(c: CategorySummary) {
    if (!confirm(`¿Seguro que quieres eliminar la categoría "${c.name}"?`))
      return;

    this.categoryService.deleteCategory(c.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((cat) => cat.id !== c.id);
      },
    });
  }

  onCategoryMenuAction(action: string, c: CategorySummary) {
    if (action === 'delete') {
      this.deleteCategory(c);
    }
  }
}
