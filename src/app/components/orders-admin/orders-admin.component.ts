import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { Order, OrdersService, OrderStatus } from '../../shared/services/private_services/orders.service';
import { AuthService } from '../../shared/services/private_services/auth.service';
import { PaginatorModule } from "primeng/paginator";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // ✅ Solo ReactiveForms
    TableModule,
    DropdownModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ButtonModule,
    PaginatorModule,
    PageHeaderComponent
],
  templateUrl: './orders-admin.component.html',
  styleUrls: ['./orders-admin.component.scss'],
})
export class OrdersAdminComponent implements OnInit {
  orders: Order[] = [];

  
  loading = true;
  storeId = '';

    ordersForm!: FormGroup;

  estados: { value: string; label: string }[] = [];


  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private auth: AuthService
  ) {}

 ngOnInit() {
    this.ordersForm = this.fb.group({ orders: this.fb.array([]) });

    // 🔥 Traemos estados desde backend
    this.ordersService.getOrderStatuses().subscribe({
      next: (res) => (this.estados = res),
      error: (err) => console.error('Error al cargar estados', err),
    });

    // 🔹 Traer pedidos
    this.loadOrders();
  }

 
  loadOrders() {
    this.ordersService.getMyOrders().subscribe({
      next: (res) => {
        this.orders = res;
        const arr = res.map((o) =>
          this.fb.group({
            id: [o.id],
            estado: [o.estado],
            fecha: [o.fecha],
            customerName: [o.customerName],
            customerPhone: [o.customerPhone],
            total: [o.total],
            paymentMethod: [o.paymentMethod],
            paymentStatus: [o.paymentStatus],
          })
        );
        this.ordersForm.setControl('orders', this.fb.array(arr));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando pedidos', err);
        this.loading = false;
      },
    });
  }

get ordersArray(): FormArray {
    return this.ordersForm.get('orders') as FormArray;
  }


  getOrderForm(i: number): FormGroup {
    return this.ordersArray.at(i) as FormGroup;
  }

updateEstado(i: number) {
    const order = this.ordersArray.at(i);
    const id = order.get('id')?.value;
    const nuevo = order.get('estado')?.value;

    this.ordersService.updateOrderStatus(id, nuevo).subscribe({
      next: (updated) => order.patchValue({ estado: updated.estado }),
      error: (err) => console.error('Error actualizando estado', err),
    });
  }

  cancelarPedido(i: number) {
    const orderForm = this.getOrderForm(i);
    orderForm.get('estado')?.setValue('CANCELADO');
    this.updateEstado(i);
  }

 getSeverity(status: string) {
  switch (status) {
    case 'RECIBIDO':
      return 'info';
    case 'PENDIENTE_PAGO':
      return 'warning';
    case 'EN_PREPARACION':
      return 'secondary'; // o 'info', según el color que prefieras
    case 'ENVIADO':
      return 'success';
    case 'ENTREGADO':
      return 'success';
    case 'CANCELADO':
      return 'danger';
    default:
      return 'secondary';
  }
}
}
