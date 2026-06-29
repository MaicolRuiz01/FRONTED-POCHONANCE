import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // Si había un token pero ya venció, limpiamos y avisamos ("Tu sesión expiró").
  // Si nunca hubo token, es un acceso normal sin login.
  if (auth.hasStoredToken()) {
    auth.logout(true);
  } else {
    router.navigate(['/login']);
  }
  return false;
};
