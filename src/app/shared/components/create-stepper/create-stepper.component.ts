import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatestoreComponent } from '../../../components/stores/createstore/createstore.component';// 👈 nuestro form de crear
import { StoreContactComponent } from "../../../components/stores/store-contact/store-contact.component";
import { StoreUbicationComponent } from "../../../components/stores/store-ubication/store-ubication.component";
import { StoreScheduleComponent } from "../../../components/stores/store-schedule/store-schedule.component";

type StepStatus = 'done' | 'current' | 'upcoming';
interface Step {
  id: 'basic' | 'contact' | 'address' | 'schedule';
  title: string;
  subtitle: string;
  content: 'form-basic' | 'form-contact' | 'form-address' | 'form-schedule';
  status: StepStatus;
}
@Component({
  selector: 'app-create-stepper',
  standalone: true,
  imports: [ CommonModule,
    CreatestoreComponent,
    StoreContactComponent,
    StoreUbicationComponent,
    StoreScheduleComponent,],
  templateUrl: './create-stepper.component.html',
  styleUrl: './create-stepper.component.scss'
})
export class CreateStepperComponent {
mobileStepsOpen = false;

  steps: Step[] = [
    { id: 'basic',    title: 'Información básica', subtitle: 'Datos iniciales',     content: 'form-basic',    status: 'current' },
    { id: 'contact',  title: 'Contacto',           subtitle: 'Email y redes',       content: 'form-contact',  status: 'upcoming' },
    { id: 'address',  title: 'Ubicación',          subtitle: 'Dirección y mapa',    content: 'form-address',  status: 'upcoming' },
    { id: 'schedule', title: 'Horarios',           subtitle: 'Apertura y cierre',   content: 'form-schedule', status: 'upcoming' },
  ];

  get selectedStep(): Step {
    return this.steps.find(s => s.status === 'current')!;
  }

  selectStep(step: Step) {
    this.steps = this.steps.map(s => ({
      ...s,
      status: s.id === step.id
        ? 'current'
        : this.isBefore(s.id, step.id) ? 'done' : 'upcoming'
    }));
    this.mobileStepsOpen = false;
  }

  goNext() {
    const idx = this.steps.findIndex(s => s.status === 'current');
    if (idx === -1 || idx === this.steps.length - 1) return;
    this.steps = this.steps.map((s, i) =>
      i < idx + 1 ? { ...s, status: 'done' } :
      i === idx + 1 ? { ...s, status: 'current' } :
      { ...s, status: 'upcoming' }
    );
  }

  private isBefore(aId: Step['id'], bId: Step['id']) {
    const a = this.steps.findIndex(s => s.id === aId);
    const b = this.steps.findIndex(s => s.id === bId);
    return a < b;
  }

  openMobileSteps()  { this.mobileStepsOpen = true; }
  closeMobileSteps() { this.mobileStepsOpen = false; }

  // Cerrar con ESC
  @HostListener('document:keydown.escape') onEsc() { this.closeMobileSteps(); }
}

