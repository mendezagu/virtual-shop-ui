import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from './session.service';
import { environment } from '../../../../environments/environment';

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
  providedIn: 'root',
})
export class PaymentsService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  constructor(
    private http: HttpClient,
    private session: SessionService,
  ) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'X-Session-Id': this.session.get(),
    });
  }

  // ============================================================
  // 🔹 Crea preferencia Checkout Pro y redirige a Mercado Pago
  // ============================================================
  async createPreferenceAndRedirect(
    items: MPItem[],
    externalRef?: string,
    payerEmail?: string,
  ) {
    const body = {
      items,
      external_reference: externalRef,
      payer_email: payerEmail,
    };

    const pref = await firstValueFrom(
      this.http.post<CreatePreferenceResponse>(
        `${this.apiUrl}/checkout-pro`,
        body,
        { headers: this.headers() }
      )
    );

    // 🔥 Redirigir al checkout de Mercado Pago
    window.location.href = pref.init_point;
  }

  // ============================================================
  // 🔹 Confirmación al volver desde MP (success / failure / pending)
  // ============================================================
  async confirmFromReturn(queryParams: any): Promise<{
    status: PaymentStatus;
    paymentId?: string;
    external_reference?: string;
  }> {
    const qp = new HttpParams({ fromObject: queryParams });

    // MP puede enviar *payment_id* o el viejo *collection_id*
    const paymentId =
      qp.get('payment_id') ??
      qp.get('collection_id') ??
      undefined;

    const external_reference =
      qp.get('external_reference') ??
      qp.get('external_reference_id') ??
      undefined;

    const hintedStatus =
      (qp.get('status') as PaymentStatus) ||
      (qp.get('collection_status') as PaymentStatus) ||
      ('pending' as PaymentStatus);

    if (!paymentId) {
      return { status: hintedStatus, external_reference };
    }

    // Obtener estado REAL desde tu backend
    const res = await firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/${paymentId}`)
    );

    const status: PaymentStatus =
      (res?.status as PaymentStatus) || hintedStatus;

    return { status, paymentId, external_reference };
  }

  // ============================================================
  // 🔹 Pago con tarjeta (Checkout Pro clásico)
  // ============================================================
  async payWithCard(body: {
    token: string;
    amount: number;
    payer_email: string;
    external_reference?: string;
    installments?: number;
  }): Promise<{ status: string; id: string }> {
    const safeBody = {
      ...body,
      external_reference: body.external_reference ?? undefined,
    };

    return await firstValueFrom(
      this.http.post<{ status: string; id: string }>(
        `${this.apiUrl}/card`,
        safeBody,
        { headers: this.headers() }
      )
    );
  }

  // ============================================================
  // 🔹 Payment Intent para Card Bricks
  // ============================================================
  async createBrickPaymentIntent(
    amount: number,
    payerEmail: string,
    externalRef?: string
  ): Promise<{ id: string; status: string }> {
    const body = {
      amount,
      payer_email: payerEmail,
      external_reference: externalRef ?? undefined,
    };

    return await firstValueFrom(
      this.http.post<{ id: string; status: string }>(
        `${this.apiUrl}/bricks/intent`,
        body,
        { headers: this.headers() }
      )
    );
  }

  // ============================================================
  // 🔹 Confirmación de pago (Card Brick)
  // ============================================================
  async confirmBrickCardPayment(
    token: string,
    amount: number,
    email: string,
    externalRef?: string
  ): Promise<{ status: string; id: string }> {
    const body = {
      token,
      amount,
      payer_email: email,
      external_reference: externalRef ?? undefined,
    };

    return await firstValueFrom(
      this.http.post<{ status: string; id: string }>(
        `${this.apiUrl}/bricks/confirm`,
        body,
        { headers: this.headers() }
      )
    );
  }

  // ============================================================
  // 🔹 Wallet Brick → Crea preferencia simple
  // ============================================================
  async createWalletPreference(
    amount: number,
    externalRef?: string,
    payerEmail?: string
  ): Promise<{ preference_id: string }> {
    const body = {
      amount,
      external_reference: externalRef,
      payer_email: payerEmail,
    };

    return await firstValueFrom(
      this.http.post<{ preference_id: string }>(
        `${this.apiUrl}/bricks/wallet`,
        body,
        { headers: this.headers() }
      )
    );
  }
}
