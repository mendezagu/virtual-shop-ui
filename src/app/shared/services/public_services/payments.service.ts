import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from './session.service';

export type MPItem = {
  title: string;
  quantity: number;
  currency_id: string; // 'ARS'
  unit_price: number;
};

export type CreatePreferenceResponse = {
  preference_id: string;
  init_point: string;
  sandbox_init_point?: string;
};

export type PaymentStatus =
  | 'approved'
  | 'pending'
  | 'in_process'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private base = 'http://localhost:3000/api/payments';

  constructor(private http: HttpClient, private session: SessionService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Session-Id': this.session.get() });
  }

  /** 🔹 Crea preferencia en tu backend y redirige al checkout */
  async createPreferenceAndRedirect(items: MPItem[], externalRef?: string, payerEmail?: string) {
    const body = { items, external_reference: externalRef, payer_email: payerEmail };

    const pref = await firstValueFrom(
      this.http.post<CreatePreferenceResponse>(`${this.base}/checkout-pro`, body, {
        headers: this.headers()
      })
    );

    // 🔥 Redirigir directo al checkout de Mercado Pago
    window.location.href = pref.init_point;
  }

  /**
   * Lee los query params al volver de MP y consulta el estado real a tu backend si hay paymentId.
   * Retorna: status, paymentId, external_reference.
   */
  async confirmFromReturn(queryParams: any): Promise<{
    status: PaymentStatus;
    paymentId?: string;
    external_reference?: string;
  }> {
    const qp = new HttpParams({ fromObject: queryParams });

    // MP puede retornar payment_id o (legacy) collection_id
    const paymentId = qp.get('payment_id') ?? qp.get('collection_id') ?? undefined;

    const external_reference =
      qp.get('external_reference') ??
      qp.get('external_reference_id') ??
      undefined;

    // status en la URL (no confiar totalmente, mejor consultar si hay paymentId)
    const hintedStatus =
      (qp.get('status') as PaymentStatus) ||
      (qp.get('collection_status') as PaymentStatus) ||
      ('pending' as PaymentStatus);

    if (!paymentId) {
      return { status: hintedStatus, external_reference };
    }

    // Consultamos a tu API para el estado definitivo
    const res = await firstValueFrom(this.http.get<any>(`${this.base}/${paymentId}`));
    const status: PaymentStatus = (res?.status as PaymentStatus) || hintedStatus;

    return { status, paymentId, external_reference };
  }

async payWithCard(body: {
  token: string;
  amount: number;
  payer_email: string;
  external_reference?: string;
  installments?: number;
}): Promise<any> {
  const safeBody = {
    ...body,
    external_reference: body.external_reference ?? undefined, // 🔹 null -> undefined
  };

  return await firstValueFrom(
    this.http.post(`${this.base}/card`, safeBody, { headers: this.headers() })
  );
}
}
