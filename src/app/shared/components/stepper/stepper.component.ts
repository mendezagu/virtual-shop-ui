import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TabViewModule } from 'primeng/tabview';
import confetti from 'canvas-confetti';

import { MyStoreComponent } from '../../../components/stores/store-basic-info/store-basic-info.component';
import { StoreContactComponent } from '../../../components/stores/store-contact/store-contact.component';
import { StoreUbicationScheduleComponent } from '../../../components/stores/store-ubication-schedule/store-ubication-schedule.component';
import { StorePersonalizationComponent } from '../../../components/stores/store-personalization/store-personalization.component';
import { PageHeaderComponent } from "../page-header/page-header.component";
import { StoreBankAccountComponent } from "../../../components/stores/store-bank-account/store-bank-account.component";

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [
    CommonModule,
    StepperModule,
    ButtonModule,
    RippleModule,
    TabViewModule,
    MyStoreComponent,
    StoreContactComponent,
    StoreUbicationScheduleComponent,
    StorePersonalizationComponent,
    PageHeaderComponent,
    StoreBankAccountComponent
],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent {
  
  activeStepIndex = 0;
  mobileStepsOpen = false;
  storeData: any = null;

  stepTitles = [
    'Información básica',
    'Pagos y logística',
    'Contacto',
    'Ubicación y horarios',
    'Personalización',
  ];

  stepSubtitles = [
    'Nombre, rubros y descripción',
    'Medios de pago y logística de tu tienda',
    'Teléfono, email y redes sociales',
    'Dirección y zona de entrega',
    'Colores, logo y portada',
  ];

  goNext() {
    if (this.activeStepIndex < this.stepTitles.length - 1) {
      this.activeStepIndex++;
    } else {
      this.launchConfetti();
    }
  }

  goPrev() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
    }
  }

  openMobileSteps() {
    this.mobileStepsOpen = true;
  }

  closeMobileSteps() {
    this.mobileStepsOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeMobileSteps();
  }

  /** 🎉 Confetti final */
  private launchConfetti() {
    const end = Date.now() + 1500;
    const colors = ['#ec4899', '#7e22ce', '#06b6d4'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 75,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 75,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  // Métodos para guardar datos entre pasos
  onBasicInfoSaved(store: any) {
    this.storeData = store;
    this.goNext();
  }

  onStepSaved() {
    this.goNext();
  }
}
