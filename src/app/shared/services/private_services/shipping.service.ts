// src/app/shared/services/private_services/shipping.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ShippingPayload } from '../../models/shipping-payload.model';

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private apiUrl = `${environment.apiUrl}/shipping`;

  constructor(private http: HttpClient) {}

  getShippingByStore(storeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/store/${storeId}`);
  }

  calculateShippingFromAddress(body: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/calculate-from-address`, body);
  }

  setShippingPrice(storeId: string, payload: ShippingPayload): Observable<any> {
    return this.http.patch(`${this.apiUrl}/price/${storeId}`, payload);
  }

  // shipping.service.ts
calculateShippingFromCoordinates(body: { storeId: string; lat: number; lng: number }): Observable<any> {
  return this.http.post(`${this.apiUrl}/calculate-from-coordinates`, body);
}

}
