import { Component, EventEmitter, Output } from '@angular/core';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '../../../shared/models/store.model';
import { StoreService } from '../../../shared/services/private_services/store.service';

@Component({
  selector: 'app-store-schedule',
  standalone: true,
  imports: [MatButtonModule, ReactiveFormsModule, CommonModule, InputComponent],
  templateUrl: './store-schedule.component.html',
  styleUrl: './store-schedule.component.scss'
})
export class StoreScheduleComponent {
@Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  storeData!: Store | null;
  isLoading = true;

  constructor(private storeService: StoreService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      horario_apertura: ['', Validators.required],
      horario_cierre: ['', Validators.required],
    });

    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores?.length) {
          this.storeData = stores[0];
          this.form.patchValue({
            horario_apertura: (this.storeData as any).horario_apertura ?? '',
            horario_cierre: (this.storeData as any).horario_cierre ?? '',
          });
        } else { this.storeData = null; }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  save() {
    if (!this.storeData) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    if (v.horario_apertura && v.horario_cierre && v.horario_apertura >= v.horario_cierre) {
      alert('La hora de apertura debe ser menor que la de cierre.');
      return;
    }

    const payload = {
      horario_apertura: v.horario_apertura,
      horario_cierre: v.horario_cierre,
    };

    this.storeService.updateStore(this.storeData.id_tienda, payload).subscribe({
      next: () => { alert('Horarios actualizados'); this.form.markAsPristine(); this.saved.emit(); },
      error: () => alert('Error al guardar horarios'),
    });
  }

}
