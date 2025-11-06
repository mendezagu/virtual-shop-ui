import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { StoreStateService } from '../../../shared/services/private_services/store-state.service';
import { MessageService } from 'primeng/api';
import { Store } from '../../../shared/models/store.model';
import { ShippingService } from '../../../shared/services/private_services/shipping.service';



@Component({
  selector: 'app-store-bank-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './store-bank-account.component.html',
  styleUrls: ['./store-bank-account.component.scss'],
})
export class StoreBankAccountComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  bankForm!: FormGroup;
  shippingForm!: FormGroup;
  isSaving = false;
  selectedPayments: string[] = [];
  selectedLogistics: string[] = [];
store: Store = {} as Store; // ⚡ casteo para inicializar
pricePerKm: number = 0;
minShippingCost: number = 0;
freeShippingThreshold: number = 0;


  bancos = [
    { label: 'Banco Nación', value: 'Banco Nación' },
    { label: 'Banco Provincia', value: 'Banco Provincia' },
    { label: 'Banco Galicia', value: 'Banco Galicia' },
    { label: 'Banco Santander', value: 'Banco Santander' },
    { label: 'Mercado Pago', value: 'Mercado Pago' },
    { label: 'Ualá', value: 'Ualá' },
    { label: 'Brubank', value: 'Brubank' },
    { label: 'Otro', value: 'Otro' },
  ];

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private storeState: StoreStateService,
    private messageService: MessageService,
    private shippingService: ShippingService
  ) {}

  ngOnInit(): void {
    this.bankForm = this.fb.group({
      numero_identificacion: ['', Validators.required],
      nombre_banco: ['', Validators.required],
      cvu_cbu: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(30),
        ],
      ],
      alias: ['', Validators.required],
    });

    this.shippingForm = this.fb.group({
  pricePerKm: [0, [Validators.required, Validators.min(1)]],
  minShipping: [0, [Validators.required, Validators.min(0)]],
  freeShipping: [0, [Validators.required, Validators.min(0)]],
});


    const store = this.storeState.getStore();
    if (store) {
      // 🟢 Cargar métodos de pago (formato legible)
      this.selectedPayments =
        store.metodos_pago?.map((m: string) => {
          switch (m) {
            case 'EFECTIVO':
              return 'Efectivo';
            case 'TRANSFERENCIA_BANCARIA':
              return 'Transferencia Bancaria';
            case 'MERCADOPAGO':
              return 'Mercado Pago';
            default:
              return m.replace('_', ' ');
          }
        }) || [];

      // 🟢 Cargar opciones de logística (formato legible)
      this.selectedLogistics =
        store.logistica?.map((l: string) => {
          switch (l) {
            case 'ENVIO_DOMICILIO':
              return 'Envío a domicilio';
            case 'RETIRO_TIENDA':
              return 'Retiro en tienda';
            default:
              return l.replace('_', ' ');
          }
        }) || [];

      // 🏦 Si tiene transferencia, cargar datos bancarios
      if (this.isSelected('Transferencia Bancaria')) {
        this.bankForm.patchValue({
          numero_identificacion: store.numero_identificacion,
          nombre_banco: store.nombre_banco,
          cvu_cbu: store.cvu_cbu,
          alias: store.alias,
        });
      }
    }
  }

  togglePayment(method: string): void {
    const idx = this.selectedPayments.indexOf(method);
    if (idx === -1) this.selectedPayments.push(method);
    else this.selectedPayments.splice(idx, 1);
  }

  isSelected(method: string): boolean {
    return this.selectedPayments.includes(method);
  }

saveData(): void {
  console.log('🟢 Click detectado');
  if (this.isSelected('Transferencia Bancaria') && this.bankForm.invalid) {
    this.bankForm.markAllAsTouched();
    return;
  }

  

  

  

  // 🟩 Construimos el payload asegurando formatos válidos para el backend
  const paymentMap: Record<string, string> = {
    'Efectivo': 'EFECTIVO',
    'Transferencia Bancaria': 'TRANSFERENCIA_BANCARIA',
    'Mercado Pago': 'MERCADOPAGO'
  };

  const logisticMap: Record<string, string> = {
    'Envío a domicilio': 'ENVIO_DOMICILIO',
    'Retiro en tienda': 'RETIRO_TIENDA'
  };

  let payload: any = {
    metodos_pago: this.selectedPayments.map((m) => paymentMap[m] || m),
    logistica: this.selectedLogistics.map((l) => logisticMap[l] || l)
  };

  if (this.isSelected('Transferencia Bancaria')) {
    const bankData = { ...this.bankForm.value };

    if (
      typeof bankData.nombre_banco === 'object' &&
      bankData.nombre_banco?.value
    ) {
      bankData.nombre_banco = bankData.nombre_banco.value;
    }

    payload = { ...payload, ...bankData };
  }

  const currentStore = this.storeState.getStore();
  if (!currentStore?.id_tienda) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'No se encontró la tienda activa.',
    });
    return;
  }

  this.isSaving = true;

  this.storeService.updateStore(currentStore.id_tienda, payload).subscribe({
    next: (updatedStore) => {
      this.isSaving = false;
      this.storeState.setStore(updatedStore);

      this.messageService.add({
        severity: 'success',
        summary: 'Cambios guardados',
        detail: 'Tus métodos de pago y logística se actualizaron correctamente.',
      });

      console.log('✅ Datos guardados:', updatedStore);
    },
    error: (err) => {
      this.isSaving = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron guardar los cambios.',
      });
      console.error(err);
    },
  });
}
saveShippingData() {
  if (this.shippingForm.invalid) {
    this.shippingForm.markAllAsTouched();
    return;
  }

  const payload = {
    pricePerKm: this.shippingForm.value.pricePerKm ?? 0,
    minShippingCost: this.shippingForm.value.minShipping ?? 0,
    freeShippingThreshold: this.shippingForm.value.freeShipping ?? 0,
  };

  const currentStore = this.storeState.getStore();
  if (!currentStore?.id_tienda) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'No se encontró la tienda activa.',
    });
    return;
  }

  this.shippingService.setShippingPrice(currentStore.id_tienda, payload)
    .subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tarifa de envío guardada correctamente',
        });
        console.log('✅ Tarifa actualizada:', res);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la tarifa de envío',
        });
      },
    });
}

  // 🚚 Toggle logística
  toggleLogistic(option: string): void {
    const idx = this.selectedLogistics.indexOf(option);
    if (idx === -1) this.selectedLogistics.push(option);
    else this.selectedLogistics.splice(idx, 1);
  }

  isLogisticSelected(option: string): boolean {
    return this.selectedLogistics.includes(option);
  }
}
