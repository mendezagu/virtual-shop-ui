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

@Component({
  standalone: true,
  selector: 'app-category-products',
  imports: [CommonModule, RouterModule, ChipModule, ButtonModule, RippleModule, CardModule, CarouselModule],
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
  meta?: any;

  page = 1;
  limit = 12;

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
  }

  fetchCategories() {
    this.publicStoreService.getCategories(this.slug).subscribe({
      next: (res) => {
        this.categories = res.data;
        this.categoriesWithAll = [
          { slug: '', name: 'Todos', count: 0 },
          ...this.categories,
        ];
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.categories = [];
        this.categoriesWithAll = [{ slug: '', name: 'Todos', count: 0 }];
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

  selectCategory(slug: string) {
    this.categorySlug = slug;
    this.page = 1;
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
