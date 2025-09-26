import { Component } from '@angular/core';
import { PublicStoreService } from '../../shared/services/public_services/publicstore.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from "@angular/material/icon";

//primeng
import { DataViewModule } from 'primeng/dataview';

@Component({
  selector: 'app-public-store',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIcon, DataViewModule],
  templateUrl: './public-store.component.html',
  styleUrl: './public-store.component.scss'
})
export class PublicStoreComponent {
  categories: { name: string; slug: string; count: number }[] = [];
  slug!: string;
  store: any;

  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.publicStoreService.getStoreBySlug(this.slug).subscribe({
next: (data) => {
  this.store = data;
  this.isLoading = false;

  // 🎨 Aplica variables de color a este componente (scope local)
  const el = document.querySelector('app-public-store') as HTMLElement;
  if (el) {
    el.style.setProperty('--primary', this.store.primary_color || '#ff4081');
    el.style.setProperty('--secondary', this.store.secondary_color || '#00bfa5');
  }
},
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });

     this.publicStoreService.getCategories(this.slug).subscribe(res => {
    this.categories = res.data;
  });
  }

  constructor(
    private route: ActivatedRoute,
    private publicStoreService: PublicStoreService
  ) {}

  // Helpers
  rubros(): string[] {
    const r = this.store?.rubro;
    if (!r) return [];
    return Array.isArray(r) ? r : String(r).split(',').map((x: string) => x.trim());
  }

   // Devuelve el handle de Instagram sin '@' ni slashes finales
  getInstagramHandle(url?: string): string {
    if (!url) return '';
    const cleaned = url.replace(/\/+$/, '');
    const last = cleaned.split('/').pop() || '';
    return last.startsWith('@') ? last.slice(1) : last;
  }

  getCategoryImage(c: { name: string; slug: string }): string | null {
  const map: Record<string, string> = {
    'restaurantes': '/assets/categorias/restaurantes.png',
    'pedidosya-market': '/assets/categorias/market.png',
    'mercados': '/assets/categorias/mercados.png',
    'helados': '/assets/categorias/helados.png',
    'kioscos': '/assets/categorias/kioscos.png',
    'bebidas': '/assets/categorias/bebidas.png',
  };
  const key = (c.slug || '').toLowerCase();
  return map[key] ?? null; // si no hay imagen conocida, usa el fallback
}

}
