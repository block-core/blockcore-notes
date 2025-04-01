import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_CARD_CONFIG } from '@angular/material/card';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable, from } from 'rxjs';
import { CheckForUpdateService } from './services/check-for-update';
import { AppUpdateService } from './services/app-update';
import { AuthGuardService } from './services/auth-guard';
import { LoggerModule, NgxLoggerLevel, TOKEN_LOGGER_WRITER_SERVICE } from '@blockcore/ngx-logger';
import { LogWriterService } from './services/log-writer';

const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) =>
  new TranslateHttpLoader(http, './assets/i18n/', '.json');

// export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
//   return new TranslateHttpLoader(http);
// }
// Custom TranslateLoader implementation using fetch
class FetchTranslateLoader implements TranslateLoader {
  constructor(private prefix: string = './assets/i18n/', private suffix: string = '.json') {}

  getTranslation(lang: string): Observable<any> {
    const promise = fetch(`${this.prefix}${lang}${this.suffix}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      });
    
    return from(promise);
  }
}

// Factory function that returns our custom loader
const fetchLoaderFactory = () => new FetchTranslateLoader('./assets/i18n/', '.json');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom([TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: fetchLoaderFactory,
      },
      // Removed deps: [HttpClient] since we don't need it anymore
    })]),
    // importProvidersFrom([TranslateModule.forRoot({
    //   loader: {
    //     provide: TranslateLoader,
    //     useFactory: httpLoaderFactory,
    //     deps: [HttpClient],
    //   },
    // })]),
    
    importProvidersFrom(LoggerModule.forRoot({ level: NgxLoggerLevel.INFO, enableSourceMaps: true, serverLogLevel: NgxLoggerLevel.OFF }, // Don't send logs anywhere!
      {
          writerProvider: {
              provide: TOKEN_LOGGER_WRITER_SERVICE,
              useClass: LogWriterService,
          },
      }))
    ,
    AppUpdateService, CheckForUpdateService, AuthGuardService, 
    importProvidersFrom(BrowserAnimationsModule),
    { provide: MAT_CARD_CONFIG, useValue: { appearance: 'outlined' } },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
