import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionService } from './session.service';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
  private readonly apiUrl = `${environment.apiUrl}/whatsapp/public`;

  constructor(private http: HttpClient, private session: SessionService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Session-Id': this.session.get() });
  }

  createLink(slug: string, payload: WhatsAppCheckoutPayload): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${this.apiUrl}/${slug}/link`,
      payload,
      { headers: this.headers() }
    );
  }
}
