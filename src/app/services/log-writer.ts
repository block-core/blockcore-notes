import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NGXLoggerWriterService, INGXLoggerMetadata, INGXLoggerConfig, NgxLoggerLevel } from '@blockcore/ngx-logger';
import { DebugLogService } from './debug-log';

@Injectable()
export class LogWriterService extends NGXLoggerWriterService {
  constructor(@Inject(PLATFORM_ID) protected override platformId: any, private debugLog: DebugLogService) {
    super(platformId);
  }

  /** Write the content sent to the log function to the sessionStorage */
  public override writeMessage(metadata: INGXLoggerMetadata, config: INGXLoggerConfig): void {
    super.writeMessage(metadata, config);

    // If the log has 100 items or more, clear 50 oldest.
    if (this.debugLog.logs.length > 100) {
      this.resize(this.debugLog.logs, 80, null);
    }

    if (this.debugLog.errors.length > 100) {
      this.resize(this.debugLog.errors, 80, null);
    }

    this.debugLog.logs.push(metadata);

    // Keep a list of ERROR and FATAL messages.
    if (metadata.level > NgxLoggerLevel.WARN) {
      this.debugLog.errors.push(metadata);
    }
  }

  resize(arr: any[], size: number, defval: any) {
    while (arr.length > size) {
      arr.shift();
    }
    while (arr.length < size) {
      arr.push(defval);
    }
  }
}
