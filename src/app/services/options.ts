import { Injectable } from '@angular/core';

export interface Options {
  hideSpam?: boolean;
  hideInvoice?: boolean;
  paused?: boolean;
  privateFeed?: boolean;
  publicFeed?: boolean;
  flatfeed?: boolean;
  ascending?: boolean;
  showLines: boolean;
  showMediaPlayer?: boolean;
  enableSpotify?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OptionsService {
  constructor() {
    this.load();
  }

  values: Options = { showLines: true };

  load() {
    let options = localStorage.getItem('blockcore:notes:nostr:options');
    if (options) {
      this.values = JSON.parse(options);
    }
  }

  save() {
    localStorage.setItem('blockcore:notes:nostr:options', JSON.stringify(this.values));
  }
}