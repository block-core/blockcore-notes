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
import { DataValidation } from './data-validation.service';

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

  /** Wipes all profiles. */
  async wipe() {
    for await (const [key, value] of this.#table.iterator({})) {
      await this.#table.del(key);
    }

    this.events = [];
    this.#updated();
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

  constructor(private eventService: EventService, private validator: DataValidation, private storage: StorageService, private profileService: ProfileService, private circlesService: CirclesService) {
    console.log('FEED SERVICE CONSTRUCTOR!');
    this.#table = this.storage.table<NostrEventDocument>('events');
  }

  scheduleProfileDownload() {
    setTimeout(() => {
      console.log('scheduleProfileDownload:setTimeout');
      this.processProfilesQueue();
      this.scheduleProfileDownload();
      console.log('Schedule Again!');
    }, 5000);
  }

  async downloadRecent(pubkeys: string[]) {
    console.log('DOWNLOAD RECENT FOR:', pubkeys);
    const relay = this.relays[0];

    const backInTime = moment().subtract(120, 'minutes').unix();

    // Start subscribing to our people feeds.
    const sub = relay.sub([{ kinds: [1], since: backInTime, authors: pubkeys }], {}) as NostrSubscription;

    sub.loading = true;

    // Keep all subscriptions around so we can close them when needed.
    this.subs.push(sub);

    sub.on('event', (originalEvent: any) => {
      const event = this.eventService.processEvent(originalEvent);

      if (!event) {
        return;
      }

      this.#persist(event);
    });

    sub.on('eose', () => {
      console.log('Initial load of people feed completed.');
      sub.loading = false;
    });
  }

  async downloadProfile(pubkey: string) {
    console.log('ADD DOWNLOAD PROFILE:', pubkey);
    if (!pubkey) {
      debugger;
      return;
    }

    this.profileQueue.push(pubkey);

    // Wait some CPU cycles for potentially more profiles before we process.
    setTimeout(() => {
      this.processProfilesQueue();
    }, 500);

    // TODO: Loop all relays until we find the profile.
    // return this.fetchProfiles(this.relays[0], [pubkey]);
  }

  profileQueue: string[] = [];

  processProfilesQueue() {
    console.log('processProfilesQueue', this.isFetching);

    // If currently fetching, just skip until next interval.
    if (this.isFetching) {
      return;
    }

    // Grab all queued up profiles and ask for them, or should we have a maximum item?
    // For now, let us grab 10 and process those until next interval.
    const pubkeys = this.profileQueue.splice(0, 10);
    this.fetchProfiles(this.relays[0], pubkeys);
  }

  isFetching = false;

  fetchProfiles(relay: Relay, authors: string[]) {
    if (!authors || authors.length === 0) {
      return;
    }

    console.log('FETCHING PROFILE!', authors);

    // Add a protection timeout if we never receive the profiles. After 30 seconds, cancel and allow query to continue.
    setTimeout(() => {
      this.isFetching = false;

      try {
        profileSub.unsub();
      } catch (err) {
        console.warn('Error during automatic failover for profile fetch.', err);
      }
    }, 30000);

    this.isFetching = true;
    let profileSub = relay.sub([{ kinds: [0], authors: authors }], {});

    profileSub.on('event', async (originalEvent: NostrEvent) => {
      console.log('EVENT ON PROFILE:', originalEvent);
      const event = this.eventService.processEvent(originalEvent);

      if (!event) {
        return;
      }

      try {
        const profile = this.validator.sanitizeProfile(JSON.parse(event.content) as NostrProfileDocument) as NostrProfileDocument;

        console.log('GOT PROFILE:;', profile);

        // Persist the profile.
        await this.profileService.updateProfile(event.pubkey, profile);

        // TODO: Add NIP-05 and nostr.directory verification.
        // const displayName = encodeURIComponent(profile.name);
        // const url = `https://www.nostr.directory/.well-known/nostr.json?name=${displayName}`;

        // const rawResponse = await fetch(url, {
        //   method: 'GET',
        //   mode: 'cors',
        // });

        // if (rawResponse.status === 200) {
        //   const content = await rawResponse.json();
        //   const directoryPublicKey = content.names[displayName];

        //   if (event.pubkey === directoryPublicKey) {
        //     if (!profile.verifications) {
        //       profile.verifications = [];
        //     }

        //     profile.verifications.push('@nostr.directory');

        //     // Update the profile with verification data.
        //     await this.profile.putProfile(event.pubkey, profile);
        //   } else {
        //     // profile.verified = false;
        //     console.warn('Nickname reuse:', url);
        //   }
        // } else {
        //   // profile.verified = false;
        // }
      } catch (err) {
        console.warn('This profile event was not parsed due to errors:', event);
      }
    });

    profileSub.on('eose', () => {
      console.log('eose for profile', authors);
      profileSub.unsub();
      this.isFetching = false;
    });
  }

  async initialize() {
    // Whenever the profile service needs to get a profile from the network, this event is triggered.
    this.profileService.profileRequested$.subscribe(async (pubkey) => {
      if (!pubkey) {
        return;
      }

      await this.downloadProfile(pubkey);
    });

    // TODO: Use rxjs to trigger the queue to process and then complete, don't do this setInterval.
    this.scheduleProfileDownload();

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

    // this.openConnection('wss://relay.damus.io');
    this.openConnection('wss://nostr-pub.wellorder.net');
  }

  openConnection(server: string) {
    this.connect(server, (relay: Relay) => {
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

        this.#persist(event);
      });

      sub.on('eose', () => {
        console.log('Initial load of people feed completed.');
        sub.loading = false;
      });
    });
  }

  connect(server: string, onConnected: any) {
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
