import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Solo cierra sesión en 401 (token expirado/inválido) cuando había un token en uso.
      // 403 = sin permiso, pero el usuario SÍ está autenticado → no sacar.
      // status 0 = backend caído / sin red → tampoco sacar (no es expiración).
      if (err.status === 401 && auth.hasStoredToken()) {
        auth.logout(true);
      }
      return throwError(() => err);
    })
  );
};
