import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PaymentsService, PaymentStatus } from '../../../shared/services/public_services/payments.service';


@Component({
  selector: 'app-pending-payment',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pending-payment.component.html',
  styleUrl: './pending-payment.component.scss'
})
export class PendingPaymentComponent {
    status: PaymentStatus | 'pending' = 'pending';
  paymentId?: string;
  externalRef?: string;

  constructor(private ar: ActivatedRoute, private payments: PaymentsService) {}

  async ngOnInit() {
    try {
      const res = await this.payments.confirmFromReturn(this.ar.snapshot.queryParams);
      this.status = res.status || 'pending';
      this.paymentId = res.paymentId;
      this.externalRef = res.external_reference;
    } catch {
      this.status = 'pending';
    }
  }
}
