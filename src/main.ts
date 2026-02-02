import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';

import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from './environment/environment';

console.log('Environment:', { production: environment.production, apiUrl: environment.apiUrl });

registerLocaleData(localeEsCo);

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'es-CO' }
  ]
}).catch((err) => console.error(err));
