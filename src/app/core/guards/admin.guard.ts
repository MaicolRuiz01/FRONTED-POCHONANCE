import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Permite el acceso solo a usuarios con rol ADMIN. */
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.isAdmin()) return true;

  if (!auth.isLoggedIn()) {
    if (auth.hasStoredToken()) auth.logout(true);
    else router.navigate(['/login']);
  } else {
    // Logueado pero no admin → lo mandamos a la vista principal.
    router.navigate(['/saldos']);
  }
  return false;
};
