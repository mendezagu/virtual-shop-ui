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
    ReactiveFormsModule
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

  responsiveOptions = [
  {
    breakpoint: '1200px',
    numVisible: 3,
    numScroll: 1,
  },
  {
    breakpoint: '768px',
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: '480px',
    numVisible: 1,
    numScroll: 1,
  },
];

  constructor(
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.categorySlug = this.route.snapshot.paramMap.get('categorySlug')!;
    this.fetch();
    this.fetchCategories();

    // inicializamos formulario reactivo
    this.formGroup = new FormGroup({
      selectedSubcategories: new FormControl([])
    });

    // escuchamos cambios en los filtros de subcategorías
    this.formGroup.get('selectedSubcategories')?.valueChanges.subscribe(value => {
      this.filterBySubcategories(value);
    });
  }

fetchCategories() {
  this.publicStoreService.getCategories(this.slug).subscribe({
    next: (res) => {
      this.categories = res.data;
      this.categoriesWithAll = [
        { slug: '', name: 'Todos', count: 0 },
        ...this.categories,
      ];

      // 🔹 tomar SOLO las subcategorías de la categoría activa
      const selectedCat = this.categories.find(c => c.slug === this.categorySlug);
      this.subcategories = selectedCat?.subcategories || [];
    },
    error: (err) => {
      console.error('Error cargando categorías:', err);
      this.categories = [];
      this.categoriesWithAll = [{ slug: '', name: 'Todos', count: 0 }];
      this.subcategories = [];
    }
  });
}

  fetch() {
    this.isLoading = true;
    this.hasError = false;
    this.publicStoreService.getProductsByCategory(this.slug, this.categorySlug, this.page, this.limit)
      .subscribe({
        next: res => {
          this.products = res.data;
          this.meta = res.meta;
          this.isLoading = false;
        },
        error: _ => {
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  filterBySubcategories(subcats: any[]) {
    if (!subcats || subcats.length === 0) {
      this.fetch(); // sin filtros → carga normal
      return;
    }

    // Si tu backend tiene endpoint de productos por subcategorías, úsalo aquí
    this.publicStoreService.getProductsBySubcategories(this.slug, subcats, this.page, this.limit)
      .subscribe({
        next: res => {
          this.products = res.data;
          this.meta = res.meta;
        },
        error: err => {
          console.error('Error filtrando productos:', err);
        }
      });
  }

selectCategory(slug: string) {
  this.categorySlug = slug;
  this.page = 1;

  // recalcular subcategorías dinámicamente
  const selectedCat = this.categories.find(c => c.slug === slug);
  this.subcategories = selectedCat?.subcategories || [];

  if (slug) {
    this.router.navigate(['/store', this.slug, 'categoria', slug]);
  } else {
    this.router.navigate(['/store', this.slug]); // Todos
  }
  this.fetch();
}


  scrollChips(offset: number) {
    if (this.chipCarousel?.nativeElement) {
      this.chipCarousel.nativeElement.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

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
}
