import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PublicStoreService } from '../../shared/services/public_services/publicstore.service';

@Component({
  standalone: true,
  selector: 'app-category-products',
  imports: [CommonModule, RouterModule],
  templateUrl: './category-products.component.html',
})
export class CategoryProductsComponent {
  slug!: string;
  categorySlug!: string;
  isLoading = true;
  hasError = false;

  products: any[] = [];
  meta?: any;

  page = 1;
  limit = 12;

  constructor(
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.categorySlug = this.route.snapshot.paramMap.get('categorySlug')!;
    this.fetch();
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