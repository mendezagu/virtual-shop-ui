// src/app/shared/services/orders.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export type OrderStatus =
  | 'RECIBIDO'
  | 'PENDIENTE_PAGO'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface OrderItem {
  id: string;
  cantidad: number;
  precio_unit: number;
  product: { nombre_producto: string };
}

export interface Order {
  id: string;
  fecha: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  estado: OrderStatus;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private base = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // 🔹 Crear nueva orden (desde un carrito)
  createOrder(payload: {
    cartId: string;
    metodo_pago: 'EFECTIVO' | 'MERCADOPAGO';
    direccion_envio?: string;
  }): Observable<Order | { order: Order; preference_id: string; init_point: string }> {
    return this.http.post<Order | any>(this.base, payload, {
      headers: this.headers(),
    });
  }
  

  // 🔹 Obtener pedidos por tienda (para vendedor)
  getOrdersByStore(storeId: string): Observable<Order[]> {
  return this.http.get<Order[]>(`${this.base}/store/${storeId}`, {
    headers: this.headers(),
  });
}

// 🔹 🔥 NUEVO: obtener estados desde el backend
  getOrderStatuses(): Observable<{ value: string; label: string }[]> {
    return this.http.get<{ value: string; label: string }[]>(`${this.base}/statuses`);
  }

  updateOrderStatus(orderId: string, estado: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/${orderId}/status`, { estado });
  }

updatePayment(orderId: string, paymentStatus: string): Observable<Order> {
  return this.http.patch<Order>(
    `${this.base}/${orderId}/payment`,
    { paymentStatus }, // 👈 debe coincidir con UpdatePaymentStatusDto
    { headers: this.headers() }
  );
}


  // 🔹 Trae todos los pedidos del vendedor
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/mine`);
  }

}
