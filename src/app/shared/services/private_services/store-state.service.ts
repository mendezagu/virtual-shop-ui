import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StoreStateService {
  private readonly STORAGE_KEY = 'currentStore';
  private readonly EXPIRATION_TIME = 1000 * 60 * 60; // 1 hora
  private storeSubject = new BehaviorSubject<any>(null);
  store$ = this.storeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Solo intentar restaurar si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.restoreFromSession();
    }
  }

  /** Guardar un nuevo store en memoria y sesión */
  setStore(store: any) {
    if (!store) return;

    const data = {
      ...store,
      _savedAt: Date.now(),
    };

    this.storeSubject.next(data);

    // ✅ Solo guardar si estamos en navegador
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('No se pudo guardar el store en sessionStorage', err);
      }
    }
  }

  /** Obtener el valor actual sin suscribirse */
  getStore() {
    return this.storeSubject.value;
  }

  /** Borrar el store del estado y del sessionStorage */
  clearStore() {
    this.storeSubject.next(null);

    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem(this.STORAGE_KEY);
      } catch (err) {
        console.warn('No se pudo eliminar el store de sessionStorage', err);
      }
    }
  }

  /** Restaurar el store si está en sesión y no expiró */
  private restoreFromSession() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      const savedAt = parsed?._savedAt || 0;
      const isExpired = Date.now() - savedAt > this.EXPIRATION_TIME;

      if (isExpired) {
        console.info('⏰ Store expirado, se limpia la sesión');
        this.clearStore();
        return;
      }

      this.storeSubject.next(parsed);
    } catch (err) {
      console.warn('Error al restaurar el store desde sesión', err);
      this.clearStore();
    }
  }
}
