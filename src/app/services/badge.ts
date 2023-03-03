import { Injectable } from '@angular/core';
import { ApplicationState } from './applicationstate';
import { EventService } from './event';
import { NostrBadgeDefinition, NostrEvent } from './interfaces';
import { Utilities } from './utilities';

@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  definitions: NostrBadgeDefinition[] = [];

  constructor(private appState: ApplicationState, private utilities: Utilities, private eventService: EventService) {}

  getDefinition(slug: string) {
    return this.definitions.find((a) => a.slug == slug);
  }

  putDefinition(event: NostrEvent) {
    const article = event as NostrBadgeDefinition;
    article.slug = this.eventService.lastDTag(event);
    article.name = this.eventService.lastTagOfType(event, 'name');
    article.description = this.eventService.lastTagOfType(event, 'description');
    article.image = this.eventService.lastTagOfType(event, 'image');
    article.thumb = this.eventService.lastTagOfType(event, 'thumb');

    if (article.pubkey == this.appState.getPublicKey()) {
      const index = this.definitions.findIndex((a) => a.slug == article.slug);

      if (index > -1) {
        const existing = this.definitions[index];

        // If the existing is newer, ignore this article.
        if (existing.created_at > article.created_at) {
          return;
        }

        // Replace when newer.
        this.definitions[index] = article;
      } else {
        this.definitions.push(article);
      }
    } else {
      // TODO: We currently don't support lookup of others articles, when the time comes, update this.
      debugger;
    }
  }
}
