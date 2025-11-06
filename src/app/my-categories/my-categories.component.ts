import { Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


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
import { ChipModule } from 'primeng/chip';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { SidebarModule } from 'primeng/sidebar';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { OnboardingService } from '../shared/services/private_services/onboarding.service';
import { PageHeaderComponent } from "../shared/components/page-header/page-header.component";

export interface CategorySummary {
  id: string; // 👈 nuevo
  name: string;
  slug: string;
  count: number;
  imageUrl?: string | null;
  products?: Producto[];
  loading?: boolean;
  // 👇 nuevos
  type?: 'NORMAL' | 'PROMOCION' | 'DESTACADO' | 'OFERTA';
  subcategories?: CategorySummary[];
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
    ConfirmDialogModule,
    ChipModule,
    TabViewModule,
    DropdownModule,
    FileUploadModule,
    DialogModule,
    PageHeaderComponent
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
  subCategoryForms: { [parentId: string]: FormGroup } = {};
  newCategoryForm!: FormGroup;
  newSpecialCategoryForm!: FormGroup;
  specialCategories: any[] = [];

  specialTypes = [
    { label: 'Promoción', value: 'PROMOCION' },
    { label: 'Destacados', value: 'DESTACADO' },
    { label: 'Ofertas', value: 'OFERTA' },
  ];
  selectedImageFile?: File;
  selectedSpecialImageFile?: File;

  showCategoryDialog = false;
  showSpecialDialog = false;

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
    private onboardingService: OnboardingService,
     @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.newCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.newSpecialCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['PROMOCION', Validators.required],
    });

    // 1. Traer las tiendas del usuario
    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores?.length > 0) {
          this.storeId = stores[0].id_tienda;
          this.storeSlug = stores[0].link_tienda;
          this.loadCategories();
          setTimeout(() => {
          this.onboardingService.startCategoriesTour();
        }, 1000);
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
        const allCategories: CategorySummary[] = Array.isArray(res.data)
          ? res.data
          : [];

        // 🔹 separar normales y especiales
        this.categories = allCategories.filter(
          (c: CategorySummary) => c.type === 'NORMAL'
        );
        this.specialCategories = allCategories.filter(
          (c: CategorySummary) => c.type !== 'NORMAL'
        );

        // generar formularios de edición para normales
        this.categories.forEach((c: CategorySummary) => {
          this.categoryForms[c.id] = this.fb.group({
            name: [c.name, [Validators.required, Validators.minLength(2)]],
          });

          this.subCategoryForms[c.id] = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            subcategories: [c.subcategories || []],
          });
        });

        // generar formularios de edición para especiales
        this.specialCategories.forEach((sc: CategorySummary) => {
          this.categoryForms[sc.id] = this.fb.group({
            name: [sc.name, [Validators.required, Validators.minLength(2)]],
          });
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.isLoading = false;
        this.hasError = true;
        this.categories = [];
        this.specialCategories = [];
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

  onFileSelected(event: any) {
    const file: File = event.files?.[0];
    if (file) this.selectedImageFile = file;
  }

  onSpecialFileSelected(event: any) {
    const file: File = event.files?.[0];
    if (file) this.selectedSpecialImageFile = file;
  }

  // 🔹 Abrir diálogo
  openCategoryDialog() {
    this.showCategoryDialog = true;
  }

  openSpecialDialog() {
    this.showSpecialDialog = true;
  }

  createCategory() {
    if (this.newCategoryForm.invalid) return;
    const name = this.newCategoryForm.value.name;

    this.categoryService.createCategory(this.storeId, name).subscribe({
      next: (cat) => {
        if (this.selectedImageFile) {
          this.categoryService
            .uploadCategoryImage(cat.id, this.selectedImageFile)
            .subscribe({
              next: (updated) => {
                this.categories.push(updated);
                this.messageService.add({
                  severity: 'success',
                  summary: 'Categoría creada',
                  detail: `"${updated.name}" fue creada con imagen.`,
                });
                this.resetDialogForm();
              },
            });
        } else {
          this.categories.push(cat);
          this.messageService.add({
            severity: 'success',
            summary: 'Categoría creada',
            detail: `"${cat.name}" fue creada exitosamente.`,
          });
          this.resetDialogForm();
        }
      },
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la categoría.',
        }),
    });
  }

  resetDialogForm() {
    this.newCategoryForm.reset();
    this.selectedImageFile = undefined;
    this.showCategoryDialog = false;
  }

  // 🔹 Crear categoría especial (con imagen)
  createSpecialCategory() {
    if (this.newSpecialCategoryForm.invalid) return;
    const { name, type } = this.newSpecialCategoryForm.value;

    this.categoryService
      .createCategory(this.storeId, name, undefined, type)
      .subscribe({
        next: (cat) => {
          if (this.selectedSpecialImageFile) {
            this.categoryService
              .uploadCategoryImage(cat.id, this.selectedSpecialImageFile)
              .subscribe({
                next: (updated) => {
                  this.specialCategories.push(updated);
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Categoría especial creada',
                    detail: `"${updated.name}" fue creada como ${updated.type} con imagen.`,
                  });
                  this.resetSpecialDialogForm();
                },
              });
          } else {
            this.specialCategories.push(cat);
            this.messageService.add({
              severity: 'success',
              summary: 'Categoría especial creada',
              detail: `"${cat.name}" fue creada como ${cat.type}.`,
            });
            this.resetSpecialDialogForm();
          }
        },
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la categoría especial.',
          }),
      });
  }

  resetSpecialDialogForm() {
    this.newSpecialCategoryForm.reset({ type: 'PROMOCION' });
    this.selectedSpecialImageFile = undefined;
    this.showSpecialDialog = false;
  }

  // Crear subcategoría
  createSubCategory(parentId: string) {
    const form = this.subCategoryForms[parentId];
    if (!form?.valid) return;
    const name = form.value.name;

    this.categoryService
      .createCategory(this.storeId, name, parentId)
      .subscribe({
        next: (sub) => {
          const parent = this.categories.find((c) => c.id === parentId);
          if (parent) {
            parent.subcategories = [...(parent.subcategories || []), sub];
          }
          form.reset();
          this.messageService.add({
            severity: 'success',
            summary: 'Subcategoría creada',
            detail: `"${sub.name}" fue creada exitosamente.`,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la subcategoría.',
          });
        },
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
      },
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
      },
    });
  }

  onCategoryMenuAction(action: string, c: CategorySummary) {
    if (action === 'delete') {
      this.deleteCategory(c);
    }
  }
}
