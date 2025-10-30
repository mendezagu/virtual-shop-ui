import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';

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
    SkeletonModule,
    DialogModule,
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
  @Input() storeData: any;
  isLoading = true;
  showPreview = false;

  actionLabel: string = 'Siguiente paso';

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
        horario_apertura_manana: [null, Validators.required],
        horario_cierre_manana: [null, Validators.required],
        horario_apertura_tarde: [null, Validators.required],
        horario_cierre_tarde: [null, Validators.required],
      },
      { validators: this.horarioValidator }
    );

    // 🔹 Escuchar cambios de hora y mostrar mensaje si hay error
    this.form
      .get('horario_apertura_manana')
      ?.valueChanges.subscribe(() => this.checkHorario());
    this.form
      .get('horario_cierre_manana')
      ?.valueChanges.subscribe(() => this.checkHorario());
    this.form
      .get('horario_apertura_tarde')
      ?.valueChanges.subscribe(() => this.checkHorario());
    this.form
      .get('horario_cierre_tarde')
      ?.valueChanges.subscribe(() => this.checkHorario());

    // 🔹 Cargar tienda existente
    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores?.length) {
          this.storeData = stores[0];
          this.form.patchValue({
            direccion: this.storeData.direccion ?? '',
            ciudad: this.storeData.ciudad ?? '',
            latitud: this.storeData.latitud ?? null,
            longitud: this.storeData.longitud ?? null,
            horario_apertura_manana: this.parseTime(this.storeData.horario_apertura_manana),
            horario_cierre_manana: this.parseTime(this.storeData.horario_cierre_manana),
            horario_apertura_tarde: this.parseTime(this.storeData.horario_apertura_tarde),
            horario_cierre_tarde: this.parseTime(this.storeData.horario_cierre_tarde),
          });

          // ✅ Cambiar texto del botón si hay datos previos
          if (
            this.storeData.direccion ||
            this.storeData.ciudad ||
            this.storeData.horario_apertura_manana ||
            this.storeData.horario_cierre_manana ||
            this.storeData.horario_apertura_tarde ||
            this.storeData.horario_cierre_tarde
          ) {
            this.actionLabel = 'Actualizar datos';
          }
        } else {
          this.storeData = null;
          this.actionLabel = 'Siguiente paso';
        }

        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });

    // 🔹 Cambiar texto del botón dinámicamente si el usuario edita algo
    this.form.valueChanges.subscribe(() => {
      const v = this.form.value;
      if (
        v.direccion?.trim() ||
        v.ciudad ||
        v.horario_apertura_manana ||
        v.horario_cierre_manana ||
        v.horario_apertura_tarde ||
        v.horario_cierre_tarde
      ) {
        this.actionLabel = 'Actualizar datos';
      } else {
        this.actionLabel = 'Siguiente paso';
      }
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
    const apertura = group.get('horario_apertura_manana')?.value;
    const cierre = group.get('horario_cierre_manana')?.value;
    const aperturaTarde = group.get('horario_apertura_tarde')?.value;
    const cierreTarde = group.get('horario_cierre_tarde')?.value;

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
    if (!this.storeData) {
      alert('Primero debes crear la información básica de la tienda.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const v = this.form.value;
    const payload = {
      direccion: v.direccion || undefined,
      ciudad: v.ciudad || undefined,
      latitud: v.latitud != null ? Number(v.latitud) : undefined,
      longitud: v.longitud != null ? Number(v.longitud) : undefined,
      horario_apertura_manana: this.formatTime(v.horario_apertura_manana),
      horario_cierre_manana: this.formatTime(v.horario_cierre_manana),
      horario_apertura_tarde: this.formatTime(v.horario_apertura_tarde),
      horario_cierre_tarde: this.formatTime(v.horario_cierre_tarde),
    };

    this.storeService.updateStore(this.storeData.id_tienda, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.form.markAsPristine();
        this.saved.emit(); // 🔥 Hace avanzar el stepper automáticamente
      },
      error: () => {
        this.isLoading = false;
        alert('Error al guardar la ubicación');
      },
    });
  }
}
