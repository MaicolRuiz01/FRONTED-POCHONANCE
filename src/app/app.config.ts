import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // onSameUrlNavigation: 'reload' → al hacer clic en un ítem del menú que apunta a la
    // ruta en la que YA estás (ej. "SALDOS" estando en /saldos), Angular vuelve a emitir la
    // navegación en vez de ignorarla. Así una vista con sub-secciones internas (Saldos) puede
    // volver a su hub al reclicar su ítem del menú.
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    MessageService
  ]
};
