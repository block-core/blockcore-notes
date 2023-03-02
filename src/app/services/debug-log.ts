import { Injectable } from '@angular/core';
import { INGXLoggerMetadata } from '@blockcore/ngx-logger';

@Injectable({
  providedIn: 'root',
})
export class DebugLogService {
  logs: INGXLoggerMetadata[] = [];
  errors: INGXLoggerMetadata[] = [];
}
