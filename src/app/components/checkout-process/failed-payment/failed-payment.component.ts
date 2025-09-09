import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PaymentsService, PaymentStatus } from '../../../shared/services/public_services/payments.service';

@Component({
  selector: 'app-failed-payment',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './failed-payment.component.html',
  styleUrl: './failed-payment.component.scss'
})
export class FailedPaymentComponent {

  status: PaymentStatus | 'rejected' = 'rejected';
  paymentId?: string;
  externalRef?: string;

  constructor(private ar: ActivatedRoute, private payments: PaymentsService) {}

  async ngOnInit() {
    try {
      const res = await this.payments.confirmFromReturn(this.ar.snapshot.queryParams);
      // si no hay info, mostramos 'rejected' por claridad en esta pantalla
      this.status = res.status || 'rejected';
      this.paymentId = res.paymentId;
      this.externalRef = res.external_reference;
    } catch {
      this.status = 'rejected';
    }
  }

}
