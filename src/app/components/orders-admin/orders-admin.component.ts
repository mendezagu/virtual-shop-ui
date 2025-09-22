import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { Order, OrdersService, OrderStatus } from '../../shared/services/private_services/orders.service';
import { AuthService } from '../../shared/services/private_services/auth.service';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './orders-admin.component.html',
  styleUrls: ['./orders-admin.component.scss'],
})
export class OrdersAdminComponent implements OnInit {
  orders: Order[] = [];
  ordersForm!: FormGroup;
  displayedColumns = ['fecha', 'cliente', 'total', 'pago', 'estado', 'acciones'];
  estados: OrderStatus[] = ['RECIBIDO','PENDIENTE_PAGO','EN_PREPARACION','ENVIADO','ENTREGADO','CANCELADO'];

  storeId = '';

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private auth: AuthService
  ) {}

ngOnInit() {
  this.ordersForm = this.fb.group({ orders: this.fb.array([]) });
  const user = this.auth.getUserData();
  console.log('Usuario logueado', user);
  this.storeId = user?.storeId || '';
  console.log('storeId detectado:', this.storeId);
  this.loadOrders();
}

loadOrders() {
  this.ordersService.getMyOrders().subscribe({
    next: (res) => {
      this.orders = res;
      const arr = this.orders.map((order) =>
        this.fb.group({
          id: [order.id],
          estado: [order.estado],
        })
      );
      this.ordersForm.setControl('orders', this.fb.array(arr));
    },
    error: (err) => console.error('Error al cargar pedidos', err),
  });
}
  get ordersArray(): FormArray {
    return this.ordersForm.get('orders') as FormArray;
  }

  getOrderForm(i: number): FormGroup {
    return this.ordersArray.at(i) as FormGroup;
  }

  updateEstado(i: number) {
    const orderForm = this.getOrderForm(i);
    const orderId = orderForm.get('id')?.value;
    const nuevoEstado = orderForm.get('estado')?.value;

    this.ordersService.updateOrderStatus(orderId, nuevoEstado).subscribe({
      next: (updated) => this.orders[i].estado = updated.estado,
      error: (err) => console.error('Error al actualizar estado', err),
    });
  }

  cancelarPedido(i: number) {
    this.getOrderForm(i).get('estado')?.setValue('CANCELADO');
    this.updateEstado(i);
  }
}
