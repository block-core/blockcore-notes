import { Injectable } from '@angular/core';
import { ApplicationState } from './applicationstate';
import { EventService } from './event';
import { NostrBadgeDefinition, NostrBadgeDocument, NostrEvent } from './interfaces';
import { QueueService } from './queue.service';
import { StorageService } from './storage';
import { Utilities } from './utilities';
import { BehaviorSubject, finalize, distinct, flatMap, from, groupBy, map, Observable, of, Subscription, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  definitions: NostrBadgeDefinition[] = [];

  selectedBadge?: NostrBadgeDefinition;

  selectedBadgePubKey?: string;

  selectedBadgeSlug?: string;

  // downloadQueue: string[] = [];

  get editable() {
    const filtered = this.definitions.filter((a) => a.pubkey == this.appState.getPublicKey());
    return filtered;
  }

  // #editable: BehaviorSubject<NostrBadgeDefinition[]> = new BehaviorSubject<NostrBadgeDefinition[]>(this.definitions);

  // get editable$(): Observable<NostrBadgeDefinition[]> {
  //   return this.#editable.asObservable().pipe();
  // }

  constructor(private queueService: QueueService, private storage: StorageService, private appState: ApplicationState, private utilities: Utilities, private eventService: EventService) {}

  getDefinition(slug: string) {
    return this.definitions.find((a) => a.slug == slug);
  }

  async initialize() {
    const badges = await this.storage.storage.getBadges();

    if (badges.length > 0) {
      this.definitions = this.convert(badges);
    }
  }

  // Quick and dirty, the badge types needs a proper refactoring very soon!
  convert(badges: NostrBadgeDocument[]) {
    const list: NostrBadgeDefinition[] = [];

    for (let index = 0; index < badges.length; index++) {
      const badge = badges[index];

      list.push({
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        image: badge.image,
        thumb: badge.thumb,
        hashtags: badge.hashtags,
        kind: 30009,
        contentCut: false,
        tagsCut: false,
        tags: [],
        content: '',
        created_at: badge.created,
        sig: '',
        pubkey: badge.pubkey,
      });
    }

    return list;
  }

  // enqueueDownload(id: string) {
  //   if (!this.downloadQueue.includes(id)) {
  //     this.downloadQueue.push(id);
  //   }

  //   this.processQueue();
  // }

  // processQueue() {
  //   const process = this.downloadQueue.splice(0, 50);

  //   if (process.length > 0) {

  //   }
  // }

  async getBadge(id: string) {
    let badge = await this.storage.storage.getBadge(id);

    if (!badge) {
      this.queueService.enqueBadgeDefinition(id);
    }

    return badge;
  }

  async putBadge(badge: NostrBadgeDocument) {
    await this.storage.storage.putBadge(badge);
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

  async putDefinition(event: NostrEvent) {
    const badge = event as NostrBadgeDefinition;
    badge.slug = this.eventService.firstDTag(event);
    badge.name = this.eventService.lastTagOfType(event, 'name');
    badge.description = this.eventService.lastTagOfType(event, 'description');
    badge.image = this.eventService.lastTagOfType(event, 'image');
    badge.thumb = this.eventService.lastTagOfType(event, 'thumb');
    badge.hashtags = this.eventService.tagsOfTypeValues(event, 't');
    badge.id = `30009:${badge.pubkey}:${badge.slug}`;

    const index = this.definitions.findIndex((a) => a.id == badge.id);

    if (index > -1) {
      const existing = this.definitions[index];

      // If the existing is newer, ignore this article.
      if (existing.created_at > badge.created_at) {
        return;
      }

      // Replace when newer.
      this.definitions[index] = badge;
      await this.saveDefinition(badge);
    } else {
      this.definitions.push(badge);
      await this.saveDefinition(badge);
    }
  }

  async saveDefinition(badge: NostrBadgeDefinition) {
    let document: NostrBadgeDocument = {
      id: badge.id,
      slug: badge.slug,
      pubkey: badge.pubkey,
      created: badge.created_at,
      created_at: badge.created_at,
      description: badge.description!,
      name: badge.name!,
      thumb: badge.thumb,
      image: badge.image,
      hashtags: badge.hashtags,
    };

    await this.storage.storage.putBadge(document);
  }
}
