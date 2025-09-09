import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../shared/services/private_services/auth.service';
import { take, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Verifica si hay token en localStorage
  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/sign-in']);
  return false;
};
