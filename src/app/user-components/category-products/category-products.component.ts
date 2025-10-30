import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PublicStoreService } from '../../shared/services/public_services/publicstore.service';
import { CarouselModule } from 'primeng/carousel';

// PrimeNG
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { CardModule } from 'primeng/card';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { StoreStateService } from '../../shared/services/private_services/store-state.service';
import { BadgeModule } from "primeng/badge";
import { SidebarModule } from "primeng/sidebar";
import { CheckboxModule } from "primeng/checkbox";
import { RadioButtonModule } from "primeng/radiobutton"; // ✅ agregado

@Component({
  standalone: true,
  selector: 'app-category-products',
  imports: [
    CommonModule,
    RouterModule,
    ChipModule,
    ButtonModule,
    RippleModule,
    CardModule,
    CarouselModule,
    MultiSelectModule,
    ReactiveFormsModule,
    BadgeModule,
    SidebarModule,
    CheckboxModule,
    RadioButtonModule
],
  templateUrl: './category-products.component.html',
})
export class CategoryProductsComponent {
  @ViewChild('chipCarousel', { static: false }) chipCarousel!: ElementRef<HTMLDivElement>;

  slug!: string;
  categorySlug!: string;
  isLoading = true;
  hasError = false;

  products: any[] = [];
  categories: any[] = [];
  categoriesWithAll: any[] = [];
  subcategories: any[] = [];
  meta?: any;

  page = 1;
  limit = 12;

  formGroup!: FormGroup;

  showFilters = false;

  responsiveOptions = [
    { breakpoint: '1200px', numVisible: 3, numScroll: 1 },
    { breakpoint: '768px', numVisible: 2, numScroll: 1 },
    { breakpoint: '480px', numVisible: 1, numScroll: 1 },
  ];

  constructor(
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService,
    private router: Router,
    private elRef: ElementRef<HTMLElement>,
    private storeState: StoreStateService // ✅ agregado
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.categorySlug = this.route.snapshot.paramMap.get('categorySlug')!;
    this.fetch();
    this.fetchCategories();

    // 🟢 1. Intentar aplicar el tema global desde storeState (si ya existe)
    const existingStore = this.storeState.getStore();
    if (existingStore) {
      this.applyTheme(existingStore);
    } else {
      // 🟢 2. Si no existe, cargarlo desde la API
      this.publicStoreService.getStoreBySlug(this.slug).subscribe({
        next: (store) => {
          this.storeState.setStore(store);
          this.applyTheme(store);
        },
        error: (err) => console.error('Error cargando tienda:', err),
      });
    }

    // 🟢 3. Inicializamos formulario reactivo
    this.formGroup = new FormGroup({
      selectedSubcategories: new FormControl([]),
    });

    // Escuchamos cambios en los filtros de subcategorías
    this.formGroup.get('selectedSubcategories')?.valueChanges.subscribe((value) => {
      this.filterBySubcategories(value);
    });

      // 🧩 3️⃣ Formulario reactivo unificado
  this.formGroup = new FormGroup({
    selectedSubcategories: new FormControl([]),
    minPrice: new FormControl(null),
    maxPrice: new FormControl(null),
    condition: new FormControl(''),
  });

  // 🔸 Reaccionar a cualquier cambio en los filtros
  this.formGroup.valueChanges.subscribe(() => {
    this.applyFilters();
  });
  }

  /** ================================
   * 🎨 Aplicar colores del backend
   * ================================ */
  private applyTheme(store: any) {
    const primary = store?.primary_color || '#ff4081';
    const secondary = store?.secondary_color || '#00bfa5';
    const bg =
      store?.background_color === 'dark'
        ? '#202123'
        : store?.background_color || '#ffffff';
    const text = store?.background_color === 'dark' ? '#f5f5f5' : '#111827';
    const surface =
      store?.background_color === 'dark' ? '#2a2b32' : '#f9fafb';

    // ✅ Aplicar al host (este componente)
    const host = this.elRef.nativeElement;
    host.style.setProperty('--primary', primary);
    host.style.setProperty('--secondary', secondary);
    host.style.setProperty('--bg', bg);
    host.style.setProperty('--text', text);
    host.style.setProperty('--surface', surface);

    // ✅ Aplicar al documento (global)
    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--text', text);
  }

  /** ================================
   * 🔹 Cargar categorías
   * ================================ */
  fetchCategories() {
    this.publicStoreService.getCategories(this.slug).subscribe({
      next: (res) => {
        this.categories = res.data;
        this.categoriesWithAll = [
          { slug: '', name: 'Todos', count: 0 },
          ...this.categories,
        ];

        // 🔹 tomar SOLO las subcategorías de la categoría activa
        const selectedCat = this.categories.find((c) => c.slug === this.categorySlug);
        this.subcategories = selectedCat?.subcategories || [];
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.categories = [];
        this.categoriesWithAll = [{ slug: '', name: 'Todos', count: 0 }];
        this.subcategories = [];
      },
    });
  }

  /** ================================
   * 🔹 Cargar productos
   * ================================ */
  fetch() {
    this.isLoading = true;
    this.hasError = false;
    this.publicStoreService
      .getProductsByCategory(this.slug, this.categorySlug, this.page, this.limit)
      .subscribe({
        next: (res) => {
          this.products = res.data;
          this.meta = res.meta;
          this.isLoading = false;
        },
        error: (_) => {
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }

  /** ================================
   * 🔹 Filtrar por subcategorías
   * ================================ */
  filterBySubcategories(subcats: any[]) {
    if (!subcats || subcats.length === 0) {
      this.fetch(); // sin filtros → carga normal
      return;
    }

    this.publicStoreService
      .getProductsBySubcategories(this.slug, subcats, this.page, this.limit)
      .subscribe({
        next: (res) => {
          this.products = res.data;
          this.meta = res.meta;
        },
        error: (err) => {
          console.error('Error filtrando productos:', err);
        },
      });
  }

  toggleSubcategory(current: string[], value: string): string[] {
  if (!current) return [value];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

  /** ================================
   * 🔹 Cambiar categoría
   * ================================ */
  selectCategory(slug: string) {
    this.categorySlug = slug;
    this.page = 1;

    const selectedCat = this.categories.find((c) => c.slug === slug);
    this.subcategories = selectedCat?.subcategories || [];

    if (slug) {
      this.router.navigate(['/store', this.slug, 'categoria', slug]);
    } else {
      this.router.navigate(['/store', this.slug]);
    }

    this.fetch();
  }

  /** ================================
   * 🔹 Scroll chips
   * ================================ */
  scrollChips(offset: number) {
    if (this.chipCarousel?.nativeElement) {
      this.chipCarousel.nativeElement.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  /** ================================
   * 🔹 Paginado
   * ================================ */
  nextPage() {
    if (this.meta && this.page < this.meta.totalPages) {
      this.page++;
      this.fetch();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.fetch();
    }
  }


  applyFilters() {
  this.isLoading = true;

  const { selectedSubcategories, minPrice, maxPrice, condition } = this.formGroup.value;

  const filters: any = {
    category: this.categorySlug,
    subcategories: selectedSubcategories || [],
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    condition: condition || undefined,
    page: this.page,
    limit: this.limit,
  };

  this.publicStoreService.getFilteredProducts(this.slug, filters).subscribe({
    next: (res) => {
      this.products = res.data;
      this.meta = res.meta;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error aplicando filtros:', err);
      this.isLoading = false;
    },
  });
}

goToProduct(productId: string) {
  this.router.navigate(['/producto', productId]);
}
  
}
