import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StoreService } from '../../../shared/services/private_services/store.service';
import { Store } from '../../../shared/models/store.model';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';

interface City {
  name: string;
  code: string;
}

@Component({
  selector: 'app-store-ubication-schedule',
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    ButtonModule,
    AvatarModule,
    MessagesModule,
  ],
  templateUrl: './store-ubication-schedule.component.html',
  styleUrl: './store-ubication-schedule.component.scss',
})
export class StoreUbicationScheduleComponent {
  @Output() saved = new EventEmitter<void>();

  cities: City[] = [];
  messages: Message[] = [];

  selectedCity: City | undefined;

  form!: FormGroup;
  storeData!: Store | null;
  isLoading = true;

  constructor(private storeService: StoreService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.cities = [
      { name: 'New York', code: 'NY' },
      { name: 'Rome', code: 'RM' },
      { name: 'London', code: 'LDN' },
      { name: 'Istanbul', code: 'IST' },
      { name: 'Paris', code: 'PRS' },
    ];

    this.form = this.fb.group(
      {
        direccion: [''],
        ciudad: [''],
        latitud: [null],
        longitud: [null],
        horario_apertura: [null, Validators.required],
        horario_cierre: [null, Validators.required],
      },
      { validators: this.horarioValidator }
    );

    // Escuchar cambios para mostrar/ocultar mensajes de error
    this.form.get('horario_apertura')?.valueChanges.subscribe(() => {
      this.checkHorario();
    });
    this.form.get('horario_cierre')?.valueChanges.subscribe(() => {
      this.checkHorario();
    });

    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores?.length) {
          this.storeData = stores[0];
          this.form.patchValue({
            direccion: (this.storeData as any).direccion ?? '',
            ciudad: (this.storeData as any).ciudad ?? '',
            latitud: (this.storeData as any).latitud ?? null,
            longitud: (this.storeData as any).longitud ?? null,
            horario_apertura: this.parseTime(
              (this.storeData as any).horario_apertura
            ),
            horario_cierre: this.parseTime(
              (this.storeData as any).horario_cierre
            ),
          });
        } else {
          this.storeData = null;
        }
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  private checkHorario() {
    if (this.form.hasError('horarioInvalido')) {
      this.messages = [
        {
          severity: 'error',
          detail: 'La hora de cierre debe ser mayor a la hora de apertura.',
        },
      ];
    } else {
      this.messages = [];
    }
  }

  horarioValidator(group: FormGroup) {
    const apertura = group.get('horario_apertura')?.value;
    const cierre = group.get('horario_cierre')?.value;

    if (apertura && cierre) {
      const aperturaDate = new Date(apertura);
      const cierreDate = new Date(cierre);

      return cierreDate > aperturaDate ? null : { horarioInvalido: true };
    }

    return null;
  }

  /** Convierte "HH:mm" en un Date para el calendario */
private parseTime(value: string | null): Date | null {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null; // 🔥 evita NaN
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

  /** Convierte un Date en "HH:mm" para enviar al backend */
  private formatTime(date: Date | null): string | undefined {
    if (!date) return undefined;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  save() {
    if (!this.storeData) return;

    const v = this.form.value;
    const payload = {
      direccion: v.direccion || undefined,
      ciudad: v.ciudad || undefined,
      latitud: v.latitud != null ? Number(v.latitud) : undefined,
      longitud: v.longitud != null ? Number(v.longitud) : undefined,
      horario_apertura: this.formatTime(v.horario_apertura),
      horario_cierre: this.formatTime(v.horario_cierre),
    };

    this.storeService.updateStore(this.storeData.id_tienda, payload).subscribe({
      next: () => {
        alert('Ubicación actualizada');
        this.form.markAsPristine();
        this.saved.emit();
      },
      error: () => alert('Error al guardar ubicación'),
    });
  }
}
