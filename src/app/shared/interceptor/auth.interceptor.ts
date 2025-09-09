import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;

    // Solo leer token si estamos en navegador
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
      }
    }

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}
