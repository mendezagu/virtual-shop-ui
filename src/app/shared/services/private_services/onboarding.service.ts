import { Injectable } from '@angular/core';
import Shepherd from 'shepherd.js';
import confetti from 'canvas-confetti';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private tour?: Shepherd.Tour;

  /** Crea un tour con config común */
  private createTour(key: string) {
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: 'smooth', block: 'center', inline: 'center' },
        canClickTarget: true,
        classes: 'shep-card' // clase para personalizar
      }
    });

    // Marcar como completo al terminar
    this.tour.on('complete', () => this.markCompleted(key));
    this.tour.on('cancel',   () => this.markCompleted(key));
  }

  /** Ejemplo de tour para la pantalla de tienda */
  startStoreTour() {
    const key = 'tour-store-v1';
    if (this.isCompleted(key)) return;

    this.createTour(key);

    this.tour!.addStep({
      id: 'bienvenida',
      text: `
        <div class="font-semibold mb-1">¡Bienvenido!</div>
        <div class="text-sm text-slate-600">Acá podés personalizar tu tienda.</div>
      `,
      attachTo: { element: '#store-header', on: 'bottom' },
      buttons: [{ text: 'Siguiente', action: () => this.tour!.next() }]
    });

    this.tour!.addStep({
      id: 'productos',
      text: `
        <div class="font-semibold mb-1">Productos</div>
        <div class="text-sm text-slate-600">Creá y ordená tus productos acá.</div>
      `,
      attachTo: { element: '#productos', on: 'right' },
      buttons: [
        { text: 'Atrás', action: () => this.tour!.back() },
        { text: 'Siguiente', action: () => this.tour!.next() }
      ]
    });

    this.tour!.addStep({
      id: 'carrito',
      text: `
        <div class="font-semibold mb-1">Carrito</div>
        <div class="text-sm text-slate-600">Vas a ver lo que agregan tus clientes.</div>
      `,
      attachTo: { element: '#carrito', on: 'left' },
      buttons: [
        { text: 'Atrás', action: () => this.tour!.back() },
        { text: 'Terminar', action: () => this.finishWithConfetti() }
      ]
    });

    this.tour!.start();
  }

  startCategoriesTour( alwaysShow: boolean = true) {
  const key = 'tour-categories-v1';
  //PARA QE SE MUESTRE SOLO UNA VEZ
  //if (this.isCompleted(key)) return;

    if (!alwaysShow && this.isCompleted(key)) return;

  this.createTour(key);

    // PASO 1: Bienvenida general
  this.tour!.addStep({
    id: 'intro-categorias',
    text: `
      <div class="font-semibold mb-1 text-lg">🎉 ¡Bien! Ahora crearemos tus categorías</div>
      <div class="text-sm text-slate-600">
        Las <b>categorías</b> te ayudan a ordenar tus productos dentro de tu tienda.<br><br>
      Pensalas como los <b>estantes</b> o <b>secciones</b> donde agrupás lo que pertenece a un mismo tipo.<br><br>
      Por ejemplo: <b>Pantalones</b>, <b>Hamburguesas</b>, <b>Limpieza</b> o <b>Herramientas</b>.<br><br>
      Dentro de cada una vas cargando los productos relacionados.
      </div>
    `,
    buttons: [
      { text: 'Siguiente', action: () => this.tour!.next() }
    ],
    modalOverlayOpeningPadding: 10,
  });

  // PASO 2: Botón “Nueva categoría”
  this.tour!.addStep({
    id: 'crear-categoria',
    text: `
      <div class="font-semibold mb-1">Crear una categoría</div>
    <div class="text-sm text-slate-600">
      Mediante este botón podrás agregar categorías para organizar tus productos.
    </div>
    `,
    attachTo: { element: 'button[label="Nueva categoría"]', on: 'bottom' },
    buttons: [
      { text: 'Atrás', action: () => this.tour!.back() },
      { text: 'Siguiente', action: () => this.tour!.next() }
    ]
  });

  // PASO 3: Categorías especiales
this.tour!.addStep({
  id: 'categorias-especiales',
  text: `
    <div class="font-semibold mb-1 text-lg">⭐ Categorías especiales</div>
    <div class="text-sm text-slate-600">
      Las <b>categorías especiales</b> sirven para destacar productos en tu tienda.<br><br>
      Podés crear secciones de <b>Promociones</b>, <b>Destacados</b> u <b>Ofertas</b> para llamar la atención de tus clientes.
    </div>
  `,
  attachTo: {
    element: '#special-categories-title', // 👈 se ancla al título
    on: 'bottom'                          // 👈 aparece justo debajo
  },
  buttons: [
    { text: 'Atrás', action: () => this.tour!.back() },
    { text: 'Finalizar', action: () => this.finishWithConfetti() }
  ]
});

  this.tour!.start();
}

  /** Mostrar confeti al completar */
  private finishWithConfetti() {
    try {
      confetti({ particleCount: 160, spread: 70, origin: { y: 0.6 } });
    } catch {}
    this.tour?.complete();
  }

  /** Helpers para “mostrar una vez” */
  private markCompleted(key: string) {
    localStorage.setItem(key, 'done');
  }
  private isCompleted(key: string) {
    return localStorage.getItem(key) === 'done';
  }
}
