import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PaymentsService, PaymentStatus } from '../../../shared/services/public_services/payments.service';

@Component({
  selector: 'app-successful-payment',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './successful-payment.component.html',
  styleUrl: './successful-payment.component.scss'
})
export class SuccessfulPaymentComponent {

   status: PaymentStatus | 'unknown' = 'unknown';
  paymentId?: string;
  externalRef?: string;

  get statusClass() {
    switch (this.status) {
      case 'approved': return 'ok';
      case 'pending':
      case 'in_process': return 'warn';
      default: return 'ok';
    }
  }

  constructor(private ar: ActivatedRoute, private payments: PaymentsService) {}

  async ngOnInit() {
    try {
      const res = await this.payments.confirmFromReturn(this.ar.snapshot.queryParams);
      this.status = res.status || 'approved';
      this.paymentId = res.paymentId;
      this.externalRef = res.external_reference;
    } catch (e) {
      this.status = 'unknown';
    }
  }

}
