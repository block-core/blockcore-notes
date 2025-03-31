import { isDevMode, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DATE_FORMATS } from './services/date-formats';
import { LoaderService } from './services/loader';
import { ApplicationState } from './services/applicationstate';
import { ThemeService } from './services/theme';
import { OptionsService } from './services/options';
import { SetupComponent } from './setup/setup';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';

export function appInit(options: OptionsService) {
  return () => options.load();
}

export function createTranslateLoader() {
  return new TranslateHttpLoader('./assets/i18n/', '.json');
}

const moduleDefinitions: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  AppRoutingModule,
  MatButtonModule,
  MatInputModule,
  MatDatepickerModule,
  MatNativeDateModule,
  TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
    },
  }),
  ServiceWorkerModule.register('ngsw-worker.js', {
    enabled: !isDevMode(),
    // Register the ServiceWorker as soon as the application is stable
    // or after 30 seconds (whichever comes first).
    registrationStrategy: 'registerWhenStable:30000',
  }),
];

import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';

// Export the standalone AppComponent bootstrapping configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),
    { provide: APP_INITIALIZER, useFactory: appInit, deps: [OptionsService], multi: true },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
    importProvidersFrom(
      BrowserModule, 
      BrowserAnimationsModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
        },
      }),
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000',
      })
    )
  ]
};

// Bootstrap the application using standalone components
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
