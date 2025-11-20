import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { environment } from './environment/environment';

// Log environment to verify which configuration is loaded at runtime
console.log('Environment:', { production: environment.production, apiUrl: environment.apiUrl });

registerLocaleData(localeEs);
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
