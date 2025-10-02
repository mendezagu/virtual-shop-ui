import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StoreStateService {
  private storeSubject = new BehaviorSubject<any>(null);

  // Observable al que se pueden suscribir otros componentes
  store$ = this.storeSubject.asObservable();

  // Guardar un nuevo store en el estado
  setStore(store: any) {
    this.storeSubject.next(store);
  }

  // Obtener el valor actual (sin suscripción)
  getStore() {
    return this.storeSubject.value;
  }

  // Limpiar (cuando salgas del modo comprador)
  clearStore() {
    this.storeSubject.next(null);
  }
}
