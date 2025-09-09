import { Component, HostListener, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyStoreComponent } from "../../../components/stores/store-basic-info/store-basic-info.component";
import { StoreUbicationComponent } from "../../../components/stores/store-ubication/store-ubication.component";
import { StoreScheduleComponent } from "../../../components/stores/store-schedule/store-schedule.component";
import { StoreContactComponent } from "../../../components/stores/store-contact/store-contact.component";

type StepStatus = 'done' | 'current' | 'upcoming';

interface Step {
  id: 'basic' | 'contact' | 'address' | 'schedule';
  title: string;
  subtitle: string;
  content: string;
  status: StepStatus;
}
@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule, MyStoreComponent, StoreUbicationComponent, StoreScheduleComponent, StoreContactComponent],
  templateUrl: './stepper.component.html',
})
export class StepperComponent {
  // Estado overlay móvil
  mobileStepsOpen = false;

  steps: Step[] = [
    { id: 'basic',    title: 'Información básica', subtitle: 'Nombre y rubros',           content: 'form-basic',    status: 'current' },
    { id: 'contact',  title: 'Contacto',           subtitle: 'Email y redes',             content: 'form-contact',  status: 'upcoming' },
    { id: 'address',  title: 'Ubicación',          subtitle: 'Dirección y coordenadas',   content: 'form-address',  status: 'upcoming' },
    { id: 'schedule', title: 'Horarios',           subtitle: 'Apertura y cierre',         content: 'form-schedule', status: 'upcoming' },
  ];

  get selectedStep(): Step {
    return this.steps.find(s => s.status === 'current')!;
  }

  selectStep(step: Step) {
    // permitir navegar libremente; si querés bloquear hasta guardar, poné guard acá
    this.steps = this.steps.map(s => ({
      ...s,
      status: s.id === step.id
        ? 'current'
        : this.isBefore(s.id, step.id) ? 'done' : 'upcoming'
    }));
    // En móvil, cerrar overlay al elegir
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