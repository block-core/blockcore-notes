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
    const badge = event as NostrBadgeDefinition;
    badge.slug = this.eventService.lastDTag(event);
    badge.name = this.eventService.lastTagOfType(event, 'name');
    badge.description = this.eventService.lastTagOfType(event, 'description');
    badge.image = this.eventService.lastTagOfType(event, 'image');
    badge.thumb = this.eventService.lastTagOfType(event, 'thumb');
    badge.hashtags = this.eventService.tagsOfTypeValues(event, 't');

    if (badge.pubkey == this.appState.getPublicKey()) {
      const index = this.definitions.findIndex((a) => a.slug == badge.slug);

      if (index > -1) {
        const existing = this.definitions[index];

        // If the existing is newer, ignore this article.
        if (existing.created_at > badge.created_at) {
          return;
        }

        // Replace when newer.
        this.definitions[index] = badge;
      } else {
        this.definitions.push(badge);
      }
    } else {
      // TODO: We currently don't support lookup of others articles, when the time comes, update this.
      debugger;
    }
  }
}
