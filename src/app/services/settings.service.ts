import { Injectable } from '@angular/core';

export interface Options {
  hideSpam?: boolean;
  hideInvoice?: boolean;
  paused?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor() {}

  options: Options = {};
}
