import { Injectable } from '@angular/core';
import { NostrEvent, NostrProfile, NostrEventDocument, NostrProfileDocument, Circle, Person, NostrSubscription } from './interfaces';
import * as sanitizeHtml from 'sanitize-html';
import { SettingsService } from './settings.service';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Relay, relayInit, Sub } from 'nostr-tools';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { CirclesService } from './circles.service';
import * as moment from 'moment';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root',
})
export class FeedService {
  #table;

  events: NostrEventDocument[] = [];

  #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);

  subs: Sub[] = [];
  relays: Relay[] = [];

  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged.asObservable();
  }

  #updated() {
    this.#eventsChanged.next(this.events);
  }

  async #persist(event: NostrEventDocument) {
    const id = event.id as string;

    // TODO: Consider what we're going to do because we push to the array from here and we need ID there.
    // Remove the id from the document before we persist.
    // delete event.id;

    await this.#table.put(id, event);

    // Add in the top or bottom, for now at the top.
    this.events.unshift(event);
    // this.events.push(event);

    this.#updated();
  }

  async #filter(predicate: (value: NostrEventDocument, key: string) => boolean): Promise<NostrEventDocument[]> {
    const iterator = this.#table.iterator<string, NostrEventDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    const items = [];

    for await (const [key, value] of iterator) {
      if (predicate(value, key)) {
        // value.id = key; // NOT NEEDED, we store id with document for this table.
        items.unshift(value);
        // items.push(value);
      }
    }

    return items;
  }

  /** Returns all events that are persisted. */
  async followEvents(count: number) {
    let counter = 0;

    return this.#filter((value, key) => {
      counter++;

      if (counter <= count) {
        return true;
      } else {
        return false;
      }
    });
  }

  constructor(private eventService: EventService, private storage: StorageService, private profileService: ProfileService, private circlesService: CirclesService) {
    console.log('FEED SERVICE CONSTRUCTOR!');
    this.#table = this.storage.table<NostrEventDocument>('events');
  }

  async initialize() {
    // Populate the profile observable.
    await this.profileService.populate();

    // Load all persisted events. This will of course be too many as user get more and more... so
    // this must be changed into a filter ASAP. Two filters are needed: "Current View" which allows scrolling back in time,
    // and an initial load which should likely just return top 100?
    this.events = await this.followEvents(50);

    this.#updated();

    // Every time profiles are updated, we must change our profile subscription.
    this.profileService.profiles$.subscribe((profiles) => {
      console.log('Profiles changed:', profiles);
    });

    this.connect('wss://relay.damus.io', (relay: Relay) => {
      console.log('Connected to:', relay);

      const authors = this.profileService.profiles.map((p) => p.pubkey);

      if (authors.length === 0) {
        console.log('No profiles found. Skipping subscribing to any data.');
        return;
      }

      const backInTime = moment().subtract(120, 'minutes').unix();

      // Start subscribing to our people feeds.
      const sub = relay.sub([{ kinds: [1], since: backInTime, authors: authors }], {}) as NostrSubscription;

      sub.loading = true;

      // Keep all subscriptions around so we can close them when needed.
      this.subs.push(sub);

      sub.on('event', (originalEvent: any) => {
        const event = this.eventService.processEvent(originalEvent);

        if (!event) {
          return;
        }

        // If not initial load, we'll grab the profile.
        // if (!this.initialLoad) {
        // this.fetchProfiles(relay, [event.pubkey]);
        // }

        this.#persist(event);

        // this.ngZone.run(() => {
        //   this.cd.detectChanges();
        // });

        // if (this.events.length > 100) {
        //   this.events.length = 80;
        // }
      });

      sub.on('eose', () => {
        console.log('Initial load of people feed completed.');
        sub.loading = false;

        // const pubKeys = this.events.map((e) => {
        //   return e.pubkey;
        // });

        // Initial load completed, let's go fetch profiles for those initial events.
        // this.fetchProfiles(relay, pubKeys);

        // this.cd.detectChanges();
      });
    });
  }

  connect(server: string = 'wss://relay.damus.io', onConnected: any) {
    // const relay = relayInit('wss://relay.nostr.info');
    const relay = relayInit(server);

    relay.on('connect', () => {
      console.log(`connected to ${relay?.url}`);
      onConnected(relay);
      //this.onConnected(relay);
    });

    relay.on('disconnect', () => {
      console.log(`DISCONNECTED! ${relay?.url}`);
    });

    relay.on('notice', () => {
      console.log(`NOTICE FROM ${relay?.url}`);
    });

    relay.connect();

    this.relays.push(relay);

    return relay;
  }
}
