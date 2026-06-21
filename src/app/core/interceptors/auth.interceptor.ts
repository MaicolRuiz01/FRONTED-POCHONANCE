import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Solo cerrar sesión en 401 (token expirado o inválido)
      // y solo si el usuario estaba autenticado (evita loops en /login)
      if (err.status === 401 && auth.isLoggedIn()) {
        auth.logout(); // limpia localStorage y navega a /login
      }
      // 403, 404 y otros errores se propagan normalmente sin cerrar sesión
      return throwError(() => err);
    })
  );
};
