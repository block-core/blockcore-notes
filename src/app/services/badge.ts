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

  selectedBadge?: NostrBadgeDefinition;

  selectedBadgePubKey?: string;

  selectedBadgeSlug?: string;

  constructor(private appState: ApplicationState, private utilities: Utilities, private eventService: EventService) {}

  getDefinition(slug: string) {
    return this.definitions.find((a) => a.slug == slug);
  }

  denormalizeBadge(badge: NostrBadgeDefinition) {
    if (!badge) {
      return;
    }

    badge.slug = this.eventService.firstDTag(badge);
    badge.name = this.eventService.lastTagOfType(badge, 'name');
    badge.description = this.eventService.lastTagOfType(badge, 'description');
    badge.image = this.eventService.lastTagOfType(badge, 'image');
    badge.thumb = this.eventService.lastTagOfType(badge, 'thumb');
    badge.hashtags = this.eventService.tagsOfTypeValues(badge, 't');
    return badge;
  }

  putDefinition(event: NostrEvent) {
    const badge = event as NostrBadgeDefinition;
    badge.slug = this.eventService.firstDTag(event);
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
