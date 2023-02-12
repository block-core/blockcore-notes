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
  enableTidal?: boolean;
  hideSideLabels?: boolean;
  primaryRelay?: string;
  peopleDisplayView: number;
  peopleDisplayType: number;
  peopleDisplaySort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OptionsService {
  constructor() {
    this.load();
  }

  values: Options = { showLines: true, peopleDisplayType: 1, peopleDisplayView: 0, peopleDisplaySort: 'name-asc' };

  load() {
    let options = localStorage.getItem('blockcore:notes:nostr:options');
    if (options) {
      this.values = JSON.parse(options);
    }

    if (this.values.peopleDisplayType == null) {
      this.values.peopleDisplayType = 1;
    }

    if (this.values.peopleDisplayView == null) {
      this.values.peopleDisplayView = 0;
    }

    if (this.values.peopleDisplaySort == null) {
      this.values.peopleDisplaySort = 'name-asc';
    }
  }

  save() {
    localStorage.setItem('blockcore:notes:nostr:options', JSON.stringify(this.values));
  }
}
