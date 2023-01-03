import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrSubscription, NostrRelay, NostrRelayDocument } from './interfaces';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { Relay, relayInit, Sub } from 'nostr-tools';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { CirclesService } from './circles.service';
import * as moment from 'moment';
import { EventService } from './event.service';
import { DataValidation } from './data-validation.service';
import { OptionsService } from './options.service';
import { RelayStorageService } from './relay.storage.service';
import { AuthenticationService } from './authentication.service';
import { ApplicationState } from './applicationstate.service';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
  defaultRelays: any = {
    'wss://relay.nostr.info': { read: true, write: true },
    'wss://nostr-pub.wellorder.net': { read: true, write: true },
    'wss://nostr.nordlysln.net': { read: true, write: true },
    'wss://relay.damus.io': { read: true, write: false },
    'wss://relay.nostr.ch': { read: true, write: true },
  };

  #table;

  // #relayTable;

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

  #relaysChanged: BehaviorSubject<NostrRelay[]> = new BehaviorSubject<NostrRelay[]>(this.relays);

  get relays$(): Observable<NostrRelay[]> {
    return this.#relaysChanged.asObservable();
  }

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

  constructor(public relayStorage: RelayStorageService, private options: OptionsService, private eventService: EventService, private storage: StorageService, private profileService: ProfileService, private appState: ApplicationState) {
    this.#table = this.storage.table<NostrEventDocument>('events');
    // this.#relayTable = this.storage.table<any>('relays');
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

    this.relaysUpdated();
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

  /** Wipes all events. */
  async wipe() {
    for await (const [key, value] of this.#table.iterator({})) {
      await this.#table.del(key);
    }

    this.relays = [];
    this.relaysUpdated();
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

  /** Takes relay in the format used for extensions and adds to persistent storage. This method does not connect to relays. */
  async appendRelays(relays: any) {
    let preparedRelays = relays;

    if (Array.isArray(preparedRelays)) {
      preparedRelays = {};

      for (let i = 0; i < relays.length; i++) {
        preparedRelays[relays[i]] = { read: true, write: true };
      }
    }

    const entries = Object.keys(preparedRelays);

    for (var i = 0; i < entries.length; i++) {
      const key = entries[i];
      const val = preparedRelays[key];
      await this.relayStorage.put({ id: key, write: val.write, read: val.read });
    }

    this.relaysUpdated();
  }

  async appendRelay(url: string, read: boolean, write: boolean) {
    await this.relayStorage.put({ id: url, read: read, write: write });
    this.relaysUpdated();
  }

  relaysUpdated() {
    this.#relaysChanged.next(this.relays);
  }

  /** Takes relay in the format used for extensions and adds to persistent storage. This method does not connect to relays. */
  async deleteRelay(url: string) {
    await this.relayStorage.delete(url);

    const relayIndex = this.relays.findIndex((r) => r.url == url);
    this.relays.splice(relayIndex, 1);

    this.relaysUpdated();
  }

  connect() {
    for (var i = 0; i < this.relayStorage.items.length; i++) {
      const entry = this.relayStorage.items[i];

      const existingConnection = this.relays.find((r) => r.url == entry.id);

      // If we are already connected, skip opening connection again.
      if (existingConnection && existingConnection.status == 1) {
        continue;
      }

      this.openConnection(entry);
    }
  }

  async reset() {
    console.log('RESET RUNNING!');
    for (var i = 0; i < this.relays.length; i++) {
      const relay = this.relays[i];
      relay.close();
    }

    this.subs = [];
    this.relays = [];

    await this.relayStorage.wipe();

    this.relaysUpdated();

    console.log('THERE ARE NO RELAYS:', this.relays);
  }

  async #connectToRelay(server: NostrRelayDocument, onConnected: any) {
    // const relay = relayInit('wss://relay.nostr.info');
    const relay = relayInit(server.id) as NostrRelay;

    relay.on('connect', () => {
      // console.log(`connected to ${relay?.url}`);
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
      console.log('Connected to:', relay.url);

      const authors = this.profileService.profiles.map((p) => p.pubkey);

      // Append ourself to the authors list so we receive everything we publish to any relay.
      authors.push(this.appState.getPublicKey());

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
        // console.log('Initial load of people feed completed.');
        sub.loading = false;
      });
    });
  }

  async initialize() {
    if (this.relays.length === 0) {
      let relays;

      try {
        const gt = globalThis as any;
        relays = await gt.nostr.getRelays();
      } catch (err) {
        relays = this.defaultRelays;
      }

      // First append whatever the extension give us of relays.
      await this.appendRelays(relays);
    }
  }
}
