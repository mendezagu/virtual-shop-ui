import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionService } from './session.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  cantidad: number;
  precio_unit: number;
  subtotal: number;
  product: any;
  variant?: any | null;
}

export interface CartResponse {
  cartId: string | null;
  status?: 'ACTIVE' | 'ORDERED' | 'ABANDONED';
  items: CartItem[];
  total: number;
  store: {
    primary_color: string;
    secondary_color: string;
    background_color: 'light' | 'dark';
  };
}

export type CheckoutResponseMP = {
  order: any;
  orderCode: string;
  preference_id: string;
  init_point: string;
};

export type CheckoutResponseCash = {
  order: any;
  orderCode: string;
  whatsappLink: string;
};

export type CheckoutResponse = CheckoutResponseMP | CheckoutResponseCash;

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private base = 'http://localhost:3000/api/cart/public';

  // 👉 BehaviorSubject con valor inicial (nunca null)
  private cartSubject = new BehaviorSubject<CartResponse>({
    cartId: null,
    items: [],
    total: 0,
    store: {
      primary_color: '',
      secondary_color: '',
      background_color: 'light',
    },
  });

  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient, private session: SessionService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Session-Id': this.session.get() });
  }

  // 👉 método para obtener observable
  getCartObservable() {
    return this.cart$;
  }

  getCart(slug: string): Observable<CartResponse> {
    return this.http
      .get<CartResponse>(`${this.base}/${slug}`, { headers: this.headers() })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  add(slug: string, body: { productId: string; cantidad: number; variantId?: string }): Observable<CartResponse> {
    return this.http
      .post<CartResponse>(`${this.base}/${slug}/add`, body, { headers: this.headers() })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  update(slug: string, itemId: string, cantidad: number): Observable<CartResponse> {
    return this.http
      .patch<CartResponse>(`${this.base}/${slug}/update`, { itemId, cantidad }, { headers: this.headers() })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  remove(slug: string, itemId: string): Observable<CartResponse> {
    return this.http
      .delete<CartResponse>(`${this.base}/${slug}/item/${itemId}`, { headers: this.headers() })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  clear(slug: string): Observable<CartResponse> {
    return this.http
      .delete<CartResponse>(`${this.base}/${slug}/clear`, { headers: this.headers() })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

checkout(slug: string, dto: any): Observable<CheckoutResponse> {
  return this.http.post<CheckoutResponse>(`http://localhost:3000/api/cart/public/${slug}/checkout`, dto, {
    headers: this.headers(),
  });
}
}
