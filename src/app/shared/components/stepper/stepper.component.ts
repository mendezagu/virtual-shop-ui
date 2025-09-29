import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { MyStoreComponent } from "../../../components/stores/store-basic-info/store-basic-info.component";
import { StoreContactComponent } from "../../../components/stores/store-contact/store-contact.component";
import { StoreUbicationScheduleComponent } from "../../../components/stores/store-ubication-schedule/store-ubication-schedule.component";
import { StoreScheduleComponent } from "../../../components/stores/store-schedule/store-schedule.component";
import { StorePersonalizationComponent } from '../../../components/stores/store-personalization/store-personalization.component';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [
    CommonModule,
    StepperModule,
    ButtonModule,
    RippleModule,
    MyStoreComponent,
    StoreContactComponent,
    StoreUbicationScheduleComponent,
    StorePersonalizationComponent
  ],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss']
})
export class StepperComponent {
  activeStepIndex = 0;
  mobileStepsOpen = false;

  stepTitles = [
    'Información básica',
    'Contacto',
    'Ubicación y horarios',
    'Personalización',

  ];

  stepSubtitles = [
    'Nombre, rubros y descripción',
    'Teléfono, email y redes sociales',
    'Dirección y zona de entrega',
    'Colores, logo y portada',
  ];

  goNext() {
    if (this.activeStepIndex < this.stepTitles.length - 1) {
      this.activeStepIndex++;
    }
  }

  goPrev() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
    }
  }

  openMobileSteps() { this.mobileStepsOpen = true; }
  closeMobileSteps() { this.mobileStepsOpen = false; }

  @HostListener('document:keydown.escape')
  onEsc() { this.closeMobileSteps(); }
}
