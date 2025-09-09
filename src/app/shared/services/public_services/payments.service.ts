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

async createPreference(items: MPItem[], externalRef?: string): Promise<CreatePreferenceResponse> {
  // NO enviamos success_url/failure_url/pending_url
  const body = { items, external_reference: externalRef };

  return await firstValueFrom(
    this.http.post<CreatePreferenceResponse>(`${this.base}/checkout-pro`, body, { headers: this.headers() })
  );
}

  redirectToCheckout(initPoint: string) {
    window.location.href = initPoint;
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
      // Sin ID, devolvemos lo que tengamos
      return { status: hintedStatus, external_reference };
    }

    // Consultamos a tu API para el estado definitivo
    const res = await firstValueFrom(this.http.get<any>(`${this.base}/${paymentId}`));
    const status: PaymentStatus = (res?.status as PaymentStatus) || hintedStatus;

    return { status, paymentId, external_reference };
  }
}
