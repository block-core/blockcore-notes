import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationState } from './applicationstate';
import { UploadService } from './upload';

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
  enableReactions?: boolean;
  enableZapping?: boolean;
  hideSideLabels?: boolean;
  primaryRelay?: string;
  peopleDisplayView: number;
  peopleDisplayType: number;
  peopleDisplaySort?: string;
  mediaService?: string;
  cameraId?: string;
  language: string;
  dir: string;
}

@Injectable({
  providedIn: 'root',
})
export class OptionsService {
  constructor() {
    this.load();
  }

  values: Options = { mediaService: UploadService.defaultService, language: 'en', dir: 'ltr', enableReactions: true, enableZapping: true, showLines: true, peopleDisplayType: 1, peopleDisplayView: 0, peopleDisplaySort: 'name-asc' };

  load() {
    let options = localStorage.getItem('blockcore:notes:nostr:options');
    if (options) {
      this.values = JSON.parse(options);
    }

    if (this.values.enableReactions == null) {
      this.values.enableReactions = true;
    }

    if (this.values.enableZapping == null) {
      this.values.enableZapping = true;
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

    if (this.values.mediaService == null) {
      this.values.mediaService = UploadService.defaultService;
    }
  }

  save() {
    localStorage.setItem('blockcore:notes:nostr:options', JSON.stringify(this.values));
  }
}
