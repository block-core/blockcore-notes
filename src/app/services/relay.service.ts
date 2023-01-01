import { Injectable } from '@angular/core';
import { NostrEvent, NostrProfile, NostrEventDocument, NostrProfileDocument, Circle, Person, NostrSubscription, NostrRelay, NostrRelayDocument } from './interfaces';
import * as sanitizeHtml from 'sanitize-html';
import { SettingsService } from './settings.service';
import { Observable, of, BehaviorSubject, map, combineLatest } from 'rxjs';
import { Relay, relayInit, Sub } from 'nostr-tools';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { CirclesService } from './circles.service';
import * as moment from 'moment';
import { EventService } from './event.service';
import { DataValidation } from './data-validation.service';
import { OptionsService } from './options.service';
import { RelayStorageService } from './relay.storage.service';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
  defaultRelays: any = {
    'wss://relay.nostr.info': { read: true, write: true },
    'wss://nostr-pub.wellorder.net': { read: true, write: true },
    'wss://nostr.nordlysln.net': { read: true, write: true },
    // 'wss://nostr-verified.wellorder.net': { read: false, write: true },
    // 'wss://nostr.bitcoiner.social': { read: true, write: true },
    // 'wss://nostr.drss.io': { read: true, write: true },
    'wss://relay.damus.io': { read: true, write: false },
    // 'wss://relay.nostr.info': { read: true, write: true },
    // 'wss://relay.minds.com/nostr/v1/ws': { read: false, write: true },
    'wss://relay.nostr.ch': { read: true, write: true },
  };

  #table;

  events: NostrEventDocument[] = [];

  #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);

  #filteredEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  #threadedEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  #rootEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  #replyEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  sortSubject = new BehaviorSubject<'asc' | 'desc'>('asc');
  sort$ = this.sortSubject.asObservable();
  sortOrder: 'asc' | 'desc' = 'asc';

  subs: Sub[] = [];
  relays: NostrRelay[] = [];
  // events$ = this.#eventsChanged.asObservable();

  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged.asObservable().pipe(
      map((data) => {
        data.sort((a, b) => {
          return a.created_at > b.created_at ? -1 : 1;
        });

        return data;
      })
    );
  }

  // get events$(): Observable<NostrEventDocument[]> {
  //   return this.#eventsChanged.asObservable();
  // }

  /** Posts that does not have any e tags and is not filtered on blocks or mutes, returns everyone. */
  get rootEvents$(): Observable<NostrEventDocument[]> {
    return (
      this.#rootEventsChanged
        .asObservable()
        .pipe(
          map((data) => {
            const filtered = data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
            return filtered;
          })
        ) // If there is any 'e' tags then skip.
        // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
        .pipe(
          map((data) => {
            data.sort((a, b) => {
              return a.created_at > b.created_at ? -1 : 1;
            });

            return data;
          })
        )
    );
  }

  get replyEvents$(): Observable<NostrEventDocument[]> {
    return (
      this.#replyEventsChanged
        .asObservable()
        .pipe(
          map((data) => {
            return data.filter((events) => events.tags.find((t) => t[0] === 'e'));
          })
        ) // If there is any 'e' tags then skip.
        // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
        .pipe(
          map((data) => {
            data.sort((a, b) => {
              if (this.options.options.ascending) {
                return a.created_at < b.created_at ? -1 : 1;
              } else {
                return a.created_at > b.created_at ? -1 : 1;
              }
            });

            return data;
          })
        )
    );
  }

  get threadedEvents$(): Observable<NostrEventDocument[]> {
    return this.#threadedEventsChanged
      .asObservable()
      .pipe(
        map((data) => {
          if (this.options.options.flatfeed) {
            return data;
            // return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
          } else {
            return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
          }
        })
      ) // If there is any 'e' tags then skip.
      .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
      .pipe(
        map((data) => {
          data.sort((a, b) => {
            if (this.options.options.ascending) {
              return a.created_at < b.created_at ? -1 : 1;
            } else {
              return a.created_at > b.created_at ? -1 : 1;
            }
          });

          return data;
        })
      );
  }

  get filteredEvents$(): Observable<NostrEventDocument[]> {
    // combineLatest([this.sort$, this.events$])
    // combineLatest([this.sort$, this.events$])
    //   .pipe(map((sortOrder, data) => data.filter((sortOrder, events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
    //   .pipe(
    //     map(([sortOrder, data]) => {
    //       this.sortOrder = sortOrder;

    //       if (sortOrder === 'asc') {
    //         return data;
    //       } else {
    //         return data.reverse();
    //       }
    //     })
    //   );

    return this.#filteredEventsChanged
      .asObservable()
      .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
      .pipe(
        map((data) => {
          data.sort((a, b) => {
            return a.created_at > b.created_at ? -1 : 1;
          });

          return data;
        })
      );
  }

  constructor(
    public relayStorage: RelayStorageService,
    private options: OptionsService,
    private eventService: EventService,
    private validator: DataValidation,
    private storage: StorageService,
    private profileService: ProfileService,
    private authService: AuthenticationService,
    private circlesService: CirclesService
  ) {
    console.log('RELAY SERVICE CONSTRUCTOR!');
    this.#table = this.storage.table<NostrEventDocument>('events');
  }

  /** Add an in-memory instance of relay and get stored metadata for it. */
  async addRelay(relay: NostrRelay) {
    const index = this.relays.findIndex((r) => r.url == relay.url);

    if (index == -1) {
      this.relays.push(relay);
    } else {
      // First initiate a close and then replace it.
      this.relays[index].close();
      this.relays[index] = relay;
    }

    try {
      const url = new URL(relay.url);
      const infoUrl = `https://${url.hostname}`;

      const rawResponse = await fetch(infoUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'application/nostr+json',
        },
      });

      if (rawResponse.status === 200) {
        const content = await rawResponse.json();

        relay.metadata.nip11 = content;
      } else {
        relay.metadata.error = `Unable to get NIP-11 data. Status: ${rawResponse.statusText}`;
      }
    } catch (err) {
      console.warn(err);
      relay.metadata.error = `Unable to get NIP-11 data. Status: ${err}`;
    }

    // Persist the latest NIP11 metadata on the NostrRelayDocument.
    await this.relayStorage.put(relay.metadata);
  }

  #updated() {
    this.#eventsChanged.next(this.events);
    this.#filteredEventsChanged.next(this.events);
    this.#threadedEventsChanged.next(this.events);
    this.#rootEventsChanged.next(this.events);
    this.#replyEventsChanged.next(this.events);
  }

  async #persist(event: NostrEventDocument) {
    const id = event.id as string;

    // TODO: Consider what we're going to do because we push to the array from here and we need ID there.
    // Remove the id from the document before we persist.
    // delete event.id;

    await this.#table.put(id, event);

    // Add in the top or bottom, for now at the top. If it already exists, should we update and alert or perhaps we should simply
    // ignore? Maybe it was saved with additional metadata, so for now we'll call the update subject.
    const eventIndex = this.events.findIndex((e) => e.id == event.id);

    if (eventIndex > -1) {
      this.events[eventIndex] = event;
    } else {
      this.events.unshift(event);
    }

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

  // scheduleProfileDownload() {
  //   setTimeout(() => {
  //     this.processProfilesQueue();
  //     this.scheduleProfileDownload();
  //   }, 5000);
  // }

  async downloadRecent(pubkeys: string[]) {
    console.log('DOWNLOAD RECENT FOR:', pubkeys);
    const relay = this.relays[0];

    const backInTime = moment().subtract(12, 'hours').unix();

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

  // TODO: Temporary container for thread events. The downloadThread should probably return an Observable that should
  // vanish when the user is finished watched it.
  thread: NostrEvent[] = [];

  // threadQueue: string[];

  downloadThread(id: string) {
    const relay = this.relays[0];

    const backInTime = moment().subtract(12, 'hours').unix();

    const sub = relay.sub([{ ['#e']: [id] }], {}) as NostrSubscription;

    sub.loading = true;

    // Keep all subscriptions around so we can close them when needed.
    this.subs.push(sub);

    sub.on('event', (originalEvent: any) => {
      const event = this.eventService.processEvent(originalEvent);

      if (!event) {
        return;
      }

      const eventIndex = this.thread.findIndex((e) => e.id == event.id);

      if (eventIndex > -1) {
        this.thread[eventIndex] = event;
      } else {
        this.thread.unshift(event);
      }
    });

    sub.on('eose', () => {
      console.log('Initial load of people feed completed.');
      sub.loading = false;
      sub.unsub();
    });
  }

  // async downloadProfile(pubkey: string) {
  //   console.log('ADD DOWNLOAD PROFILE:', pubkey);
  //   if (!pubkey) {
  //     debugger;
  //     return;
  //   }

  //   this.profileQueue.push(pubkey);

  //   // Wait some CPU cycles for potentially more profiles before we process.
  //   setTimeout(() => {
  //     this.processProfilesQueue();
  //   }, 500);

  //   // TODO: Loop all relays until we find the profile.
  //   // return this.fetchProfiles(this.relays[0], [pubkey]);
  // }

  // profileQueue: string[] = [];

  // processProfilesQueue() {
  //   // console.log('processProfilesQueue', this.isFetching);

  //   // If currently fetching, just skip until next interval.
  //   if (this.isFetching) {
  //     return;
  //   }

  //   // Grab all queued up profiles and ask for them, or should we have a maximum item?
  //   // For now, let us grab 10 and process those until next interval.
  //   const pubkeys = this.profileQueue.splice(0, 10);
  //   this.fetchProfiles(this.relays[0], pubkeys);
  // }

  // isFetching = false;

  // fetchProfiles(relay: Relay, authors: string[]) {
  //   if (!authors || authors.length === 0) {
  //     return;
  //   }

  //   console.log('FETCHING PROFILE!', authors);

  //   // Add a protection timeout if we never receive the profiles. After 30 seconds, cancel and allow query to continue.
  //   setTimeout(() => {
  //     this.isFetching = false;

  //     try {
  //       profileSub.unsub();
  //     } catch (err) {
  //       console.warn('Error during automatic failover for profile fetch.', err);
  //     }
  //   }, 30000);

  //   this.isFetching = true;
  //   let profileSub = relay.sub([{ kinds: [0], authors: authors }], {});

  //   profileSub.on('event', async (originalEvent: NostrEvent) => {
  //     console.log('EVENT ON PROFILE:', originalEvent);
  //     const event = this.eventService.processEvent(originalEvent);

  //     if (!event) {
  //       return;
  //     }

  //     try {
  //       const profile = this.validator.sanitizeProfile(JSON.parse(event.content) as NostrProfileDocument) as NostrProfileDocument;

  //       console.log('GOT PROFILE:;', profile);

  //       // Persist the profile.
  //       await this.profileService.updateProfile(event.pubkey, profile);

  //       // TODO: Add NIP-05 and nostr.directory verification.
  //       // const displayName = encodeURIComponent(profile.name);
  //       // const url = `https://www.nostr.directory/.well-known/nostr.json?name=${displayName}`;

  //       // const rawResponse = await fetch(url, {
  //       //   method: 'GET',
  //       //   mode: 'cors',
  //       // });

  //       // if (rawResponse.status === 200) {
  //       //   const content = await rawResponse.json();
  //       //   const directoryPublicKey = content.names[displayName];

  //       //   if (event.pubkey === directoryPublicKey) {
  //       //     if (!profile.verifications) {
  //       //       profile.verifications = [];
  //       //     }

  //       //     profile.verifications.push('@nostr.directory');

  //       //     // Update the profile with verification data.
  //       //     await this.profile.putProfile(event.pubkey, profile);
  //       //   } else {
  //       //     // profile.verified = false;
  //       //     console.warn('Nickname reuse:', url);
  //       //   }
  //       // } else {
  //       //   // profile.verified = false;
  //       // }
  //     } catch (err) {
  //       console.warn('This profile event was not parsed due to errors:', event);
  //     }
  //   });

  //   profileSub.on('eose', () => {
  //     console.log('eose for profile', authors);
  //     profileSub.unsub();
  //     this.isFetching = false;
  //   });
  // }

  /** Takes relay in the format used for extensions and adds to persistent storage. This method does not connect to relays. */
  async appendRelays(relays: any) {
    const entries = Object.keys(relays);

    for (var i = 0; i < entries.length; i++) {
      const key = entries[i];
      const val = relays[key];
      await this.relayStorage.put({ id: key, write: val.write, read: val.read });
    }
  }

  connect() {
    for (var i = 0; i < this.relayStorage.items.length; i++) {
      const entry = this.relayStorage.items[i];
      this.openConnection(entry);
    }
  }

  async reset() {
    for (var i = 0; i < this.relays.length; i++) {
      const relay = this.relays[i];
      relay.close();
    }

    this.subs = [];
    this.relays = [];

    await this.relayStorage.wipe();
  }

  async #connectToRelay(server: NostrRelayDocument, onConnected: any) {
    // const relay = relayInit('wss://relay.nostr.info');
    const relay = relayInit(server.id) as NostrRelay;

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

    // Keep a reference of the metadata on the relay instance.
    relay.metadata = server;

    await this.addRelay(relay);

    return relay;
  }

  openConnection(server: NostrRelayDocument) {
    this.#connectToRelay(server, (relay: Relay) => {
      console.log('Connected to:', relay);

      const authors = this.profileService.profiles.map((p) => p.pubkey);

      // if (authors.length === 0) {
      //   console.log('No profiles found. Skipping subscribing to any data.');
      //   return;
      // }

      // Append ourself to the authors list so we receive everything we publish to any relay.
      authors.push(this.authService.authInfo$.getValue().publicKeyHex!);

      console.log('LISTENTING TO FOLLOWING:', authors);

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

  async initialize() {
    // Whenever the profile service needs to get a profile from the network, this event is triggered.
    // this.profileService.profileRequested$.subscribe(async (pubkey) => {
    //   if (!pubkey) {
    //     return;
    //   }
    //   await this.downloadProfile(pubkey);
    // });
    // // TODO: Use rxjs to trigger the queue to process and then complete, don't do this setInterval.
    // this.scheduleProfileDownload();
    // Populate the profile observable.
    // await this.profileService.populate();
    // Load all persisted events. This will of course be too many as user get more and more... so
    // this must be changed into a filter ASAP. Two filters are needed: "Current View" which allows scrolling back in time,
    // and an initial load which should likely just return top 100?
    // this.events = await this.followEvents(50);
    // this.#updated();
    // Every time profiles are updated, we must change our profile subscription.
    // this.profileService.profiles$.subscribe((profiles) => {
    //   console.log('Profiles changed:', profiles);
    // });
    // this.openConnection('wss://relay.damus.io');
    // this.openConnection('wss://nostr-pub.wellorder.net');
  }
}
