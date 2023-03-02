import { NGXLogger, NgxLoggerLevel } from '@blockcore/ngx-logger';
import { Injectable } from '@angular/core';
import { Logger } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class LoggerService implements Logger {
  constructor(private logger: NGXLogger) {}

  /** Change the logging level to TRACE. This is not persisted and reset on app reloads. */
  enableDebug() {
    this.logger.updateConfig({ level: NgxLoggerLevel.TRACE });
  }

  disableDebug() {
    this.logger.updateConfig({ level: NgxLoggerLevel.INFO });
  }

  trace(message?: any | (() => any), ...additional: any[]): void {
    this.logger.trace(message, ...additional);
  }

  debug(message?: any | (() => any), ...additional: any[]): void {
    this.logger.debug(message, ...additional);
  }

  info(message?: any | (() => any), ...additional: any[]): void {
    this.logger.info(message, ...additional);
  }

  log(message?: any | (() => any), ...additional: any[]): void {
    this.logger.log(message, ...additional);
  }

  warn(message?: any | (() => any), ...additional: any[]): void {
    this.logger.warn(message, ...additional);
  }

  error(message?: any | (() => any), ...additional: any[]): void {
    this.logger.error(message, ...additional);
  }

  fatal(message?: any | (() => any), ...additional: any[]): void {
    this.logger.fatal(message, ...additional);
  }
}
