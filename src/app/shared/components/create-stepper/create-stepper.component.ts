import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { MyStoreComponent } from '../../../components/stores/store-basic-info/store-basic-info.component';
import { StoreContactComponent } from '../../../components/stores/store-contact/store-contact.component';
import { StoreUbicationScheduleComponent } from '../../../components/stores/store-ubication-schedule/store-ubication-schedule.component';
import { StoreScheduleComponent } from '../../../components/stores/store-schedule/store-schedule.component';
import { StorePersonalizationComponent } from "../../../components/stores/store-personalization/store-personalization.component";

@Component({
  selector: 'app-create-stepper',
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
  templateUrl: './create-stepper.component.html',
  styleUrls: ['./create-stepper.component.scss'],
})
export class CreateStepperComponent {
  // estado de mobile overlay
  mobileStepsOpen = false;
  activeStepIndex = 0;

  stepTitles = [
    'Información básica',
    'Contacto',
    'Ubicación y horarios',
    'Personalización',
    
  ];

  stepSubtitles = [
    'Datos iniciales de la tienda',
    'Teléfono, email y redes sociales',
    'Dirección y zona de entrega',
    'Colores, logo y portada',

  ];

  openMobileSteps() {
    this.mobileStepsOpen = true;
  }
  closeMobileSteps() {
    this.mobileStepsOpen = false;
  }
  @HostListener('document:keydown.escape') onEsc() {
    this.closeMobileSteps();
  }

  goNext() {
    if (this.activeStepIndex < 3) {
      this.activeStepIndex++;
    }
  }

  goPrev() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
    }
  }
}
