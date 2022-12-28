import { Injectable } from '@angular/core';
import { FeedService } from './feed.service';

export interface Options {
  hideSpam?: boolean;
  hideInvoice?: boolean;
  paused?: boolean;
  privateFeed?: boolean;
  publicFeed?: boolean;
  flatfeed?: boolean;
  ascending?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OptionsService {
  constructor() {}

  options: Options = {};
}
