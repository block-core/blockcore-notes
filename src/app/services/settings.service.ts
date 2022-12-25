import { Injectable } from '@angular/core';

export interface Options {
  hideSpam?: boolean;
  hideInvoice?: boolean;
  paused?: boolean;
  privateFeed?: boolean;
  publicFeed?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor() {}

  options: Options = {};
}
