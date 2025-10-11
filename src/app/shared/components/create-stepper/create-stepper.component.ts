import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import confetti from 'canvas-confetti';

import { MyStoreComponent } from '../../../components/stores/store-basic-info/store-basic-info.component';
import { StoreContactComponent } from '../../../components/stores/store-contact/store-contact.component';
import { StoreUbicationScheduleComponent } from '../../../components/stores/store-ubication-schedule/store-ubication-schedule.component';
import { StorePersonalizationComponent } from '../../../components/stores/store-personalization/store-personalization.component';

@Component({
  selector: 'app-create-stepper',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    ButtonModule,
    RippleModule,
    MyStoreComponent,
    StoreContactComponent,
    StoreUbicationScheduleComponent,
    StorePersonalizationComponent,
  ],
  templateUrl: './create-stepper.component.html',
  styleUrls: ['./create-stepper.component.scss'],
})
export class CreateStepperComponent {
  /** Estado general */
  activeStepIndex = 0;
  mobileStepsOpen = false;
  storeData: any = null;

  /** Listado de pasos */
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

  /** Control del overlay móvil */
  openMobileSteps() {
    this.mobileStepsOpen = true;
  }

  closeMobileSteps() {
    this.mobileStepsOpen = false;
  }

  @HostListener('document:keydown.escape') onEsc() {
    this.closeMobileSteps();
  }

  /** Eventos */
  onBasicInfoSaved(store: any) {
    this.storeData = store;
    this.goNext();
  }

  onStepSaved() {
    this.goNext();
  }

  goNext() {
    if (this.activeStepIndex < this.stepTitles.length - 1) {
      this.activeStepIndex++;
    } else {
      this.launchConfetti(); // 🎉 cuando finaliza
    }
  }

  goPrev() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
    }
  }

  /** 🎉 Efecto confeti final */
  private launchConfetti() {
    const end = Date.now() + 1500;
    const colors = ['#ec4899', '#7e22ce', '#4f46e5', '#06b6d4'];

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
}
