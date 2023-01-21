import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrRelay, NostrRelayDocument } from './interfaces';
import { Observable, BehaviorSubject, from, merge, timeout, catchError, of, finalize, tap } from 'rxjs';
import { Relay, relayInit, Sub } from 'nostr-tools';
import { EventService } from './event';
import { OptionsService } from './options';
import { ApplicationState } from './applicationstate';
import { CacheService } from './cache';
import { liveQuery, Subscription } from 'dexie';
import { StorageService } from './storage';
import { dexieToRx } from '../shared/utilities';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
  defaultRelays: any = {
    'wss://nostr-pub.wellorder.net': { read: true, write: true },
    'wss://no.str.cr': { read: true, write: true },
    // 'wss://relay.nostr.info': { read: true, write: true },
    'wss://nostr.nordlysln.net': { read: true, write: true },
    'wss://relay.nostr.ch': { read: true, write: true },
    'wss://e.nos.lol': { read: true, write: true },
    'wss://nostr.mom': { read: true, write: true },
    'wss://relay.snort.social': { read: true, write: true },
    'wss://relay.nostr.bg': { read: true, write: true },
    'wss://relay.damus.io': { read: true, write: true },
    'wss://nostr.fmt.wiz.biz': { read: true, write: true },
  };

  private get table() {
    return this.db.relays;
  }

  cache = new CacheService();

  items$ = dexieToRx(liveQuery(() => this.list()));

  async list() {
    return await this.table.toArray();
  }

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

  /** These are relay instances that have connection over WebSocket and holds a reference to database metadata for the relay. */
  relays: NostrRelay[] = [];

  #relaysChanged: BehaviorSubject<NostrRelay[]> = new BehaviorSubject<NostrRelay[]>(this.relays);

  get relays$(): Observable<NostrRelay[]> {
    return this.#relaysChanged.asObservable();
  }

  constructor(private db: StorageService, private options: OptionsService, private eventService: EventService, private appState: ApplicationState) {
    // Whenever the visibility becomes visible, run connect to ensure we're connected to the relays.
    this.appState.visibility$.subscribe((visible) => {
      if (visible) {
        this.connect();
      }
    });
  }

  getActiveRelay(url: string) {
    const index = this.relays.findIndex((r) => r.url == url);

    if (index == -1) {
      return null;
    } else {
      return this.relays[index];
    }
  }

  /** Add an in-memory instance of relay and get stored metadata for it. */
  async addRelay(relay: NostrRelay) {
    const index = this.relays.findIndex((r) => r.url == relay.url);

    if (index == -1) {
      this.relays.push(relay);
    } else {
      // First initiate a close and then replace it.
      // Attempting to not close existing connections, there is no point in doing so.
      // this.relays[index].close();
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
        relay.metadata.error = undefined;
      } else {
        relay.metadata.error = `Unable to get NIP-11 data. Status: ${rawResponse.statusText}`;
      }
    } catch (err) {
      console.warn(err);
      relay.metadata.error = `Unable to get NIP-11 data. Status: ${err}`;
    }

    await this.putRelayMetadata(relay.metadata);
  }

  async putRelayMetadata(metadata: NostrRelayDocument) {
    // Persist the latest NIP11 metadata on the NostrRelayDocument.
    await this.table.put(metadata);
    this.relaysUpdated();
  }

  #updated() {
    this.#eventsChanged.next(this.events);
    this.#filteredEventsChanged.next(this.events);
    this.#threadedEventsChanged.next(this.events);
    this.#rootEventsChanged.next(this.events);
    this.#replyEventsChanged.next(this.events);
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
      await this.table.put({ url: key, write: val.write, read: val.read, public: true });
    }

    this.relaysUpdated();
  }

  async appendRelay(url: string, read: boolean, write: boolean) {
    await this.table.put({ url: url, read: read, write: write, public: true });
    this.relaysUpdated();
  }

  relaysUpdated() {
    this.#relaysChanged.next(this.relays);
  }

  /** Takes relay in the format used for extensions and adds to persistent storage. This method does not connect to relays. */
  async deleteRelay(url: string) {
    await this.table.delete(url);

    const relayIndex = this.relays.findIndex((r) => r.url == url);
    let existingRelayInstance = this.relays.splice(relayIndex, 1);

    // Disconnect from the relay when we delete it.
    if (existingRelayInstance.length > 0) {
      existingRelayInstance[0].close();
    }

    this.relaysUpdated();
  }

  connectedRelays() {
    return this.relays.filter((r) => r.status === 1);
  }

  async connect() {
    const items = await this.table.toArray();

    let relayCountCountdown = items.filter((i) => i.enabled !== false).length;

    const observables = [];

    for (var i = 0; i < items.length; i++) {
      const entry = items[i];
      const existingConnection = this.relays.find((r) => r.url == entry.url);

      // If we are already connected, skip opening connection again.
      if (existingConnection && (existingConnection.status == 1 || existingConnection.metadata.enabled === false)) {
        continue;
      }

      observables.push(this.openConnection(entry));
    }

    let timer: any;

    merge(...observables).subscribe(() => {
      // As we receive an initial connection, let's create a new observable that will trigger the connection status
      // update either when everything is connected or a timeout is reached.
      relayCountCountdown--;

      // If we reach zero, update the status immediately.
      if (relayCountCountdown == 0) {
        clearTimeout(timer);
        this.appState.updateConnectionStatus(true);
      }

      if (!timer) {
        // Wait a maximum of 3 seconds for all connections to finish.
        timer = setTimeout(() => {
          this.appState.updateConnectionStatus(true);
        }, 3000);
      }
    });
  }

  async reset() {
    console.log('RESET RUNNING!');
    for (var i = 0; i < this.relays.length; i++) {
      const relay = this.relays[i];
      relay.close();
    }

    this.subs = [];
    this.relays = [];

    await this.table.clear();

    this.relaysUpdated();

    console.log('THERE ARE NO RELAYS:', this.relays);
  }

  async #connectToRelay(server: NostrRelayDocument, onConnected: any) {
    const existingActiveRelay = this.getActiveRelay(server.url);

    // If the relay already exists, just return that and do nothing else.
    if (existingActiveRelay) {
      onConnected(existingActiveRelay);
    }

    // const relay = relayInit('wss://relay.nostr.info');
    const relay = relayInit(server.url) as NostrRelay;
    relay.subscriptions = [];

    relay.on('connect', () => {
      // console.log(`connected to ${relay?.url}`);
      onConnected(relay);
      //this.onConnected(relay);
    });

    relay.on('disconnect', () => {
      console.log(`DISCONNECTED! ${relay?.url}`);
      relay.subscriptions = [];
    });

    relay.on('notice', (msg: any) => {
      console.log(`NOTICE FROM ${relay?.url}: ${msg}`);
    });

    // Keep a reference of the metadata on the relay instance.
    relay.metadata = server;

    if (relay.metadata.enabled == undefined) {
      relay.metadata.enabled = true;
    }

    try {
      if (relay.metadata.enabled) {
        await relay.connect();
      }
    } catch (err) {
      console.log(err);
      relay.metadata.error = 'Unable to connect.';
    }

    await this.addRelay(relay);

    return relay;
  }

  openConnection(server: NostrRelayDocument) {
    return new Observable((observer) => {
      this.#connectToRelay(server, (relay: Relay) => {
        console.log('Connected to:', relay.url);

        const existingIndex = this.relays.findIndex((r) => r.url == relay.url);

        if (existingIndex > -1) {
          // Put the connected relay into the array together with the metadata.
          this.relays[existingIndex] = relay as NostrRelay;
        } else {
          // Put the connected relay into the array together with the metadata.
          this.relays.push(relay as NostrRelay);
        }

        observer.next(true);
        observer.complete();

        // this.subscribeToFollowing(relay);
      });
    });
  }

  subscriptions: any = {};

  async initialize() {
    // If there are no relay metatadata in database, get it from extension or default
    const items = await this.table.toArray();

    if (items.length === 0) {
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
