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

 setStore(store: any) {
    if (!store) return;
    const data = { ...store, _savedAt: Date.now() };
    this.storeSubject.next(data);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  getStore() {
    return this.storeSubject.value;
  }

  clearStore() {
    this.storeSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private restoreFromSession() {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.storeSubject.next(parsed);
    }
  }
}
