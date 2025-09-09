import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionService } from './session.service';
import { Observable } from 'rxjs';

export interface WhatsAppCheckoutPayload {
  cartId?: string;
  customerName: string;
  customerWhatsapp: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  deliveryMethod?: 'Delivery' | 'Pickup';
  scheduleDate?: string;   // "YYYY-MM-DD"
  scheduleTime?: string;   // "HH:mm"
  paymentMethod?: string;
  invoiceUrl?: string;
  deliveryFee?: string | number;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private base = 'http://localhost:3000/api/whatsapp/public';

  constructor(private http: HttpClient, private session: SessionService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Session-Id': this.session.get() });
  }

  createLink(slug: string, payload: WhatsAppCheckoutPayload): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${this.base}/${slug}/link`,
      payload,
      { headers: this.headers() }
    );
  }
}
