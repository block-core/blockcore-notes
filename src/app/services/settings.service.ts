import { Injectable } from '@angular/core';
import { FeedService } from './feed.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(public feedService: FeedService) {}
}
