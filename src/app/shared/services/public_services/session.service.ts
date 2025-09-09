import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

const KEY = 'pediapp.sid';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  get(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('sessionId') || this.generate();
    }
    // En SSR: devolver un placeholder (no rompe el render)
    return 'server-session';
  }

  set(id: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sessionId', id);
    }
  }

  private generate(): string {
    const id = Math.random().toString(36).substring(2);
    this.set(id);
    return id;
  }
}
