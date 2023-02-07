import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrRelay, NostrRelayDocument, NostrRelaySubscription, ProfileStatus, QueryJob } from './interfaces';
import { Observable, BehaviorSubject, from, merge, timeout, catchError, of, finalize, tap } from 'rxjs';
import { Filter, Kind, Relay, relayInit, Sub } from 'nostr-tools';
import { EventService } from './event';
import { OptionsService } from './options';
import { ApplicationState } from './applicationstate';
import { CacheService } from './cache';
import { StorageService } from './storage';
import { RelayType } from '../types/relay';
import { RelayResponse } from './messages';
import { ProfileService } from './profile';
import { Utilities } from './utilities';
import { v4 as uuidv4 } from 'uuid';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ImportSheet } from '../shared/import-sheet/import-sheet';
import { QueueService } from './queue.service';
import { UIService } from './ui';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
  defaultRelays: any = {
    // 'wss://nostr-pub.wellorder.net': { read: true, write: true },
    // 'wss://relay.nostr.ch': { read: true, write: true },
    // 'wss://relay.damus.io': { read: true, write: true },
    'wss://relay.plebstr.com': { read: true, write: true },
    'wss://relay.nostr.info': { read: true, write: true },
    'wss://e.nos.lol': { read: true, write: true },
    'wss://nostr.mom': { read: true, write: true },
    'wss://relay.snort.social': { read: true, write: true },
    'wss://relay.nostr.bg': { read: true, write: true },
    'wss://nostr.fmt.wiz.biz': { read: true, write: true },
  };

  cache = new CacheService();

  events: NostrEventDocument[] = [];

  threadSubscription?: string;

  profileEventSubscription?: string;

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

  constructor(
    private ui: UIService,
    private queue: QueueService,
    private bottomSheet: MatBottomSheet,
    private utilities: Utilities,
    private profileService: ProfileService,
    private db: StorageService,
    private options: OptionsService,
    private eventService: EventService,
    private appState: ApplicationState
  ) {
    // Whenever the visibility becomes visible, run connect to ensure we're connected to the relays.
    this.appState.visibility$.subscribe((visible) => {
      if (visible) {
        // this.connect();
      }
    });

    this.queue.queues$.subscribe((job) => {
      if (job) {
        this.enque(job);
      }
    });

    // Whenever the pubkey changes, we'll load the profile and start loading the user's events.
    // If the ID is reset, we'll also unsubscribe the subscription.
    this.ui.pubkey$.subscribe(async (id) => {
      if (!id) {
        if (this.profileEventSubscription) {
          this.unsubscribe(this.profileEventSubscription);
          this.profileEventSubscription = undefined;
        }

        return;
      }

      const profile = await this.db.storage.getProfile(id);

      if (profile) {
        this.ui.setProfile(profile);
      } else {
        this.enque({ type: 'Profile', identifier: id });
      }

      // Subscribe to events for the current user profile.
      this.profileEventSubscription = this.subscribe([{ authors: [id], kinds: [Kind.Text, Kind.Reaction, 6] }]);
    });

    // Whenever the event ID changes, we'll attempt to load the event.
    this.ui.eventId$.subscribe(async (id) => {
      if (!id) {
        return;
      }

      const event = await this.db.storage.getEvent(id);

      if (!event) {
        this.enque({ type: 'Event', identifier: id });
      } else {
        this.ui.setEvent(event);
      }
    });

    // Whenever the active UI event is changed, we'll subscribe to the thread of events and keep
    // updating the events to render in the UI. We will also load the immediate parent event.
    this.ui.event$.subscribe(async (event) => {
      // If the event is empty, we'll clear the existing events first.
      if (!event) {
        this.ui.clearEvents();
        return;
      }

      if (this.threadSubscription != event?.id) {
        // Unsubscribe the previous thread subscription.
        if (this.threadSubscription) {
          this.unsubscribe(this.threadSubscription);
        }

        this.threadSubscription = this.subscribe([{ ['#e']: [event.id!] }]);

        if (event.parentEventId) {
          const parentEvent = await this.db.storage.getEvent(event.parentEventId);

          if (parentEvent) {
            this.ui.setParentEvent(parentEvent);
          } else {
            this.enque({ type: 'Event', identifier: event.parentEventId! });
          }
        }
      }
    });
  }

  workers: RelayType[] = [];

  terminate(url: string) {
    const worker = this.workers.find((r) => r.url == url);

    if (worker) {
      worker.terminate();
    }
  }

  async setRelayType(url: string, type: number) {
    const relay = await this.db.storage.getRelay(url);
    const item = this.items2.find((r) => r.url == url);

    if (relay) {
      relay.type = type;
      item!.type = type;
      await this.db.storage.putRelay(relay);
    }
  }

  async setRelayPublic(url: string, publicRelay: boolean) {
    const relay = await this.db.storage.getRelay(url);
    const item = this.items2.find((r) => r.url == url);

    if (relay) {
      relay.public = publicRelay;
      item!.public = publicRelay;
      await this.db.storage.putRelay(relay);
    }
  }

  async setRelayStatus(url: string, status: number) {
    console.log('setRelayStatus:', status);
    const relay = await this.db.storage.getRelay(url);
    const item = this.items2.find((r) => r.url == url);

    if (relay) {
      relay.status = status;
      item!.status = status;
      await this.db.storage.putRelay(relay);
    }
  }

  setRelayTimeout(url: string, status: number) {
    const item = this.items2.find((r) => r.url == url);

    if (item) {
      if (item.timeouts == null) {
        item.timeouts = 0;
      }

      item.timeouts++;
    }
  }

  setRelayCounter(url: string) {
    const item = this.items2.find((r) => r.url == url);

    if (item) {
      if (item.eventcount == null) {
        item.eventcount = 0;
      }

      item.eventcount++;
    }
  }

  async setRelayNIP11(url: string, data: any) {
    console.log('setRelayNIP11:', data);

    const relay = await this.db.storage.getRelay(url);
    const item = this.items2.find((r) => r.url == url);

    if (relay) {
      if (data.error) {
        relay.error = data.error;
        item!.error = data.error;
      } else {
        relay.nip11 = data;
        item!.nip11 = data;
      }

      await this.db.storage.putRelay(relay);

      console.log('Relay updated witn NIP11');
    }
  }

  async addRelay2(url: string, read: boolean, write: boolean) {
    let relay = this.items2.find((r) => r.url == url);
    let type = 1;

    if (write && !read) {
      type = 2;
    } else if (!write && !read) {
      type = 0;
    }

    if (!relay) {
      relay = {
        public: true,
        url: url,
        type: type,
      };

      this.db.storage.putRelay(relay);
      this.items2.push(relay);
    } else {
      if (relay.type !== type) {
        relay.type = type;
        this.db.storage.putRelay(relay);
      }
    }

    if (type === 1) {
      this.createRelayWorker(relay.url);
    } else {
      this.terminate(relay.url);
    }
  }

  async deleteRelays(keepRelays: string[]) {
    // Relays to remove
    const relaysToRemove = this.items2.filter((r) => keepRelays.indexOf(r.url) == -1);

    console.log('relaysToRemove:', relaysToRemove);

    for (let index = 0; index < relaysToRemove.length; index++) {
      const relay = relaysToRemove[index];
      await this.db.storage.deleteRelay(relay.url);

      console.log(`${relay.url}: Deleted from database.`);

      const worker = this.workers.find((w) => w.url == relay.url);
      console.log(`${relay.url}: Terminating this Web Worker!`, worker?.url);

      worker?.terminate();
    }

    // Relays to keep
    this.items2 = this.items2.filter((r) => keepRelays.indexOf(r.url) > -1);

    // await this.db.storage.deleteRelays();

    // for (let i = 0; i < this.workers.length; i++) {
    //   const worker = this.workers[i];
    //   worker.terminate();
    // }

    // this.items2 = [];
  }

  openImportSheet(data: any): void {
    this.bottomSheet.open(ImportSheet, {
      data: data,
    });
  }

  currentDisplayedContacts: any;

  async processEvent(response: RelayResponse) {
    const originalEvent = response.data;
    const event = this.eventService.processEvent(originalEvent);

    if (!event) {
      return;
    }

    console.log('SAVE EVENT?:', event);

    if (event.kind == Kind.Metadata) {
      // This is a profile event, store it.
      const nostrProfileDocument = this.utilities.mapProfileEvent(event);

      if (nostrProfileDocument) {
        console.log('START UPDATE PROFILE');
        await this.profileService.updateProfile(nostrProfileDocument.pubkey, nostrProfileDocument);
        console.log('END UPDATE PROFILE');
      }

      if (this.ui.pubkey == event.pubkey) {
        this.ui.setProfile(nostrProfileDocument);
      }
    } else if (event.kind == Kind.Contacts) {
      const pubkey = this.appState.getPublicKey();

      // If the event is for logged on user...
      if (event.pubkey === pubkey) {
        let existingContacts = await this.db.storage.getContacts(pubkey);

        if (!existingContacts || existingContacts.created_at < event.created_at) {
          await this.db.storage.putContacts(event);

          // Whenever we download the contacts document, we'll refresh the RELAYS and FOLLOWING
          // on the profile in question.
          const following = event.tags.map((t) => t[1]);

          // Make sure we run update and not put whenever we download the latest profile.
          this.profileService.followingAndRelays(event.pubkey, following, event.content);

          existingContacts = event;
        }

        const following = await this.db.storage.getProfilesByStatusCount(ProfileStatus.Follow);

        if (following == 0) {
          // If we have already imported a newer, ignore the rest of the code.
          if (this.currentDisplayedContacts && this.currentDisplayedContacts.created_at >= existingContacts.created_at) {
            return;
          }

          const pubkeys = existingContacts.tags.map((t: any[]) => t[1]);
          const dialogData: any = { pubkeys: pubkeys, pubkey: pubkey, relays: [], relaysCount: 0 };

          if (existingContacts.content) {
            dialogData.relays = JSON.parse(existingContacts.content);
            dialogData.relaysCount = Object.keys(dialogData.relays).length;
          }

          // If there are no following in the file, skip.
          if (dialogData.pubkeys.length > 0 || dialogData.relaysCount > 0) {
            this.currentDisplayedContacts = existingContacts;
            this.openImportSheet(dialogData);
          }
        }

        // // Sometimes we might discover newer or older profiles, make sure we only update UI dialog if newer.
        // if (this.discoveredProfileDate < data.created_at) {
        //   this.discoveredProfileDate = data.created_at;
        //   const following = this.profileService.profile?.following;
        //   const pubkeys = data.tags.map((t: any[]) => t[1]);
        //   console.log('FOLLOWING:' + JSON.stringify(following));
        //   if (!following) {
        //     const dialogData: any = { pubkeys: pubkeys, pubkey: data.pubkey };
        //     if (data.content) {
        //       dialogData.relays = JSON.parse(data.content);
        //       dialogData.relaysCount = Object.keys(dialogData.relays).length;
        //     }
        //     this.openImportSheet(dialogData);
        //   }
        // }
      } else {
        await this.db.storage.putContacts(event);

        // Whenever we download the contacts document, we'll refresh the RELAYS and FOLLOWING
        // on the profile in question.
        const following = event.tags.map((t) => t[1]);

        // Make sure we run update and not put whenever we download the latest profile.
        this.profileService.followingAndRelays(event.pubkey, following, event.content);
      }
    } else {
      const index = this.profileService.followingKeys.indexOf(event.pubkey);

      // If the event we received is from someone the user is following, always persist it if not already persisted.
      if (index > -1) {
        await this.db.storage.putEvents(event);
      } else if (event.pubkey === this.appState.getPublicKey()) {
        // If user's own event, also persist.
        await this.db.storage.putEvents(event);
      }

      console.log('EVENT:', event);

      // If the received event is what the user is currently looking at, update it.
      if (this.ui.eventId == event.id) {
        this.ui.setEvent(event);
      } else if (this.ui.parentEventId == event.id) {
        this.ui.setParentEvent(event);
      } else if (this.ui.pubkey == event.pubkey) {
        // If the event belongs to current visible profile.
        this.ui.putEvent(event);
      } else {
        // If we receive event on the thread subscription, and only then, update the events array.
        if (response.subscription == this.threadSubscription) {
          this.ui.putEvent(event);
        }
      }
    }
  }

  enque(job: QueryJob) {
    // Enque the job on all web workers.
    this.action('enque', job);
  }

  async handleRelayMessage(ev: MessageEvent, url: string) {
    const response = ev.data as RelayResponse;

    switch (response.type) {
      case 'timeout':
        console.log(`Relay ${url} timeout: ${response.data}.`);
        this.setRelayTimeout(url, response.data);
        break;
      case 'status':
        console.log(`Relay ${url} changed status to ${response.data}.`);
        await this.setRelayStatus(url, response.data);

        // Upon first successful connection, we'll set the status to online.
        // Upon status set to 1, make sure we subscribe to the existing subscriptions.
        if (response.data === 1) {
          this.appState.updateConnectionStatus(true);

          const index = this.workers.findIndex((v) => v.url == url);
          const worker = this.workers[index];

          for (let index = 0; index < this.subs2.length; index++) {
            const sub = this.subs2[index];
            worker.subscribe(sub.filters, sub.id);
          }
        }

        break;
      case 'terminated':
        // When being terminated, we'll remove this worker from the array.
        console.log(`${url}: WE HAVE TERMINATED`);
        const index = this.workers.findIndex((v) => v.url == url);

        // Set the status and then terminate this instance.
        const worker = this.workers[index];
        worker.status = 'terminated';

        console.log(`${url}: Calling actually TERMINATE on Web Worker!`);
        // Perform the actual termination of the Web Worker.
        worker.worker?.terminate();

        // Remove from list of workers.
        if (index > -1) {
          this.workers.splice(index, 1);
        }

        await this.setRelayStatus(url, -1);

        break;
      case 'event':
        console.log('EVENT FROM:', url);
        this.setRelayCounter(url);
        await this.processEvent(response);
        break;
      case 'nip11':
        console.log('EVENT FROM:', url);
        await this.setRelayNIP11(url, response.data);
        break;
    }
  }

  async handleRelayError(ev: ErrorEvent, url: string) {
    const response = ev.error as RelayResponse;
    await this.setRelayStatus(url, -1);

    console.warn('ERROR IN WEB WORKER FOR RELAY!', ev);
    console.warn('ERROR IN WEB WORKER FOR RELAY22!', ev.error);
  }

  /** Provide the event for a one-shot publish and disconnect. */
  createRelayWorker(url: string, event?: any) {
    if (!url) {
      console.warn('SUPPLIED EMPTY URL TO CREATE RELAY WORKER!');
      return;
    }

    const index = this.workers.findIndex((v) => v.url == url);

    // Avoid adding duplicate workers, but make sure we initiate a connect action.
    if (index > -1) {
      console.log(`${url}: This relay already exists, calling connect on it.`);
      this.workers[index].connect(undefined, event);
      return;
    }

    const relayType = new RelayType(url);
    console.log(`${url}: Creating this web worker.`);

    // Append the worker immediately to the array.
    this.workers.push(relayType);

    const worker = relayType.start();

    worker.onmessage = async (ev) => {
      console.log(`${relayType.url}: onmessage`, ev.data);
      await this.handleRelayMessage(ev, relayType.url);
    };

    worker.onerror = async (ev) => {
      console.log(`${relayType.url}: onerror`, ev.error);
      await this.handleRelayError(ev, relayType.url);
    };

    relayType.connect(this.subs2, event);

    console.table(this.workers);
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
  // async addRelay(relay: NostrRelay) {
  //   const index = this.relays.findIndex((r) => r.url == relay.url);

  //   if (index == -1) {
  //     this.relays.push(relay);
  //   } else {
  //     // First initiate a close and then replace it.
  //     // Attempting to not close existing connections, there is no point in doing so.
  //     // this.relays[index].close();
  //     this.relays[index] = relay;
  //   }

  //   try {
  //     const url = new URL(relay.url);
  //     const infoUrl = `https://${url.hostname}`;

  //     const rawResponse = await fetch(infoUrl, {
  //       method: 'GET',
  //       mode: 'cors',
  //       headers: {
  //         Accept: 'application/nostr+json',
  //       },
  //     });

  //     if (rawResponse.status === 200) {
  //       const content = await rawResponse.json();

  //       relay.metadata.nip11 = content;
  //       relay.metadata.error = undefined;
  //     } else {
  //       relay.metadata.error = `Unable to get NIP-11 data. Status: ${rawResponse.statusText}`;
  //     }
  //   } catch (err) {
  //     console.warn(err);
  //     relay.metadata.error = `Unable to get NIP-11 data. Status: ${err}`;
  //   }

  //   await this.putRelayMetadata(relay.metadata);
  // }

  // async putRelayMetadata(metadata: NostrRelayDocument) {
  //   // Persist the latest NIP11 metadata on the NostrRelayDocument.
  //   await this.table.put(metadata);
  //   this.relaysUpdated();
  // }

  #updated() {
    this.#eventsChanged.next(this.events);
    this.#filteredEventsChanged.next(this.events);
    this.#threadedEventsChanged.next(this.events);
    this.#rootEventsChanged.next(this.events);
    this.#replyEventsChanged.next(this.events);
  }

  getRelayUrls(relays: any) {
    let preparedRelays = relays;

    if (Array.isArray(preparedRelays)) {
      preparedRelays = {};

      for (let i = 0; i < relays.length; i++) {
        preparedRelays[relays[i]] = {};
      }
    }

    const entries = Object.keys(preparedRelays);
    return entries;
  }

  /** Takes relay in the format used for extensions and adds to persistent storage. */
  async appendRelays(relays: any) {
    let preparedRelays = relays;

    if (Array.isArray(preparedRelays)) {
      preparedRelays = {};

      for (let i = 0; i < relays.length; i++) {
        preparedRelays[relays[i]] = {};
      }
    }

    const entries = Object.keys(preparedRelays);

    for (var i = 0; i < entries.length; i++) {
      const key = entries[i];
      const val = preparedRelays[key];
      await this.addRelay2(key, val.read, val.write);
    }
  }

  /** read/write is currently ignored, should be changed to type. */
  async appendRelay(url: string, read: boolean, write: boolean) {
    await this.addRelay2(url, read, write);
  }

  // relaysUpdated() {
  //   this.#relaysChanged.next(this.relays);
  // }

  async deleteRelay2(url: string) {
    const index = this.items2.findIndex((r) => r.url == url);

    if (index == -1) {
      return;
    }

    const worker = this.workers.find((w) => w.url == url);
    worker?.terminate();

    await this.db.storage.deleteRelay(url);
    this.items2.splice(index, 1);
  }

  // async deleteRelay(url: string) {
  //   await this.table.delete(url);

  //   const relayIndex = this.relays.findIndex((r) => r.url == url);
  //   let existingRelayInstance = this.relays.splice(relayIndex, 1);

  //   // Disconnect from the relay when we delete it.
  //   if (existingRelayInstance.length > 0) {
  //     existingRelayInstance[0].close();
  //   }

  //   this.relaysUpdated();
  // }

  connectedRelays() {
    return this.relays.filter((r) => r.status === 1);
  }

  // async connect() {
  //   debugger;
  //   const enabledRelays = this.items2.filter((r) => r.type == 1);

  //   for (let index = 0; index < enabledRelays.length; index++) {
  //     const relay = enabledRelays[index];
  //     this.createRelayWorker(relay.url);
  //   }
  // }

  // async reset() {
  //   console.log('RESET RUNNING!');
  //   for (var i = 0; i < this.relays.length; i++) {
  //     const relay = this.relays[i];
  //     relay.close();
  //   }

  //   this.subs = [];
  //   this.relays = [];

  //   await this.table.clear();

  //   this.relaysUpdated();

  //   console.log('THERE ARE NO RELAYS:', this.relays);
  // }

  // async #connectToRelay(server: NostrRelayDocument, onConnected: any) {
  //   const existingActiveRelay = this.getActiveRelay(server.url);

  //   // If the relay already exists, just return that and do nothing else.
  //   if (existingActiveRelay) {
  //     onConnected(existingActiveRelay);
  //   }

  //   // const relay = relayInit('wss://relay.nostr.info');
  //   const relay = relayInit(server.url) as NostrRelay;
  //   // relay.subscriptions = [];

  //   relay.on('connect', () => {
  //     // console.log(`connected to ${relay?.url}`);
  //     onConnected(relay);
  //     //this.onConnected(relay);
  //   });

  //   relay.on('disconnect', () => {
  //     console.log(`DISCONNECTED! ${relay?.url}`);
  //     // relay.subscriptions = [];
  //   });

  //   relay.on('notice', (msg: any) => {
  //     console.log(`NOTICE FROM ${relay?.url}: ${msg}`);
  //   });

  //   // Keep a reference of the metadata on the relay instance.
  //   relay.metadata = server;

  //   // if (relay.metadata.enabled == undefined) {
  //   //   relay.metadata.enabled = true;
  //   // }

  //   try {
  //     if (relay.metadata.type == 1) {
  //       await relay.connect();
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     relay.metadata.error = 'Unable to connect.';
  //   }

  //   await this.addRelay(relay);

  //   return relay;
  // }

  // openConnection(server: NostrRelayDocument) {
  //   return new Observable((observer) => {
  //     this.#connectToRelay(server, (relay: Relay) => {
  //       console.log('Connected to:', relay.url);

  //       const existingIndex = this.relays.findIndex((r) => r.url == relay.url);

  //       if (existingIndex > -1) {
  //         // Put the connected relay into the array together with the metadata.
  //         this.relays[existingIndex] = relay as NostrRelay;
  //       } else {
  //         // Put the connected relay into the array together with the metadata.
  //         this.relays.push(relay as NostrRelay);
  //       }

  //       observer.next(true);
  //       observer.complete();

  //       // this.subscribeToFollowing(relay);
  //     });
  //   });
  // }

  subscriptions: any = {};

  subs2: NostrRelaySubscription[] = [];

  /** Queues up subscription that will be activated whenever the relay is connected. */
  queueSubscription(filters: Filter[]) {
    const id = uuidv4();
    this.subs2.push({ id: id, filters: filters });
    return id;
  }

  subscribe(filters: Filter[]) {
    const id = uuidv4();
    // this.action('subscribe', { filters, id });

    this.subs2.push({ id: id, filters: filters });

    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.subscribe(filters, id);
    }

    // this.sub = this.relayService.workers[0].subscribe([{ authors: [this.appState.getPublicKey()], kinds: [1] }]);
    return id;
  }

  action(action: string, data: any) {
    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.action(action, data);
    }

    // Spin up all the write-only relays temporarily when kind is contacts or metadata.
    if (action === 'publish' && (data.kind == Kind.Contacts || data.kind == Kind.Metadata)) {
      // Get all relays that are write-only
      const filteredRelays = this.items2.filter((r) => r.type == 2);

      for (let index = 0; index < filteredRelays.length; index++) {
        const relay = filteredRelays[index];
        this.createRelayWorker(relay.url, data);
      }
    }
  }

  publish(data: any) {
    this.action('publish', data);
  }

  unsubscribe(id: string) {
    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.unsubscribe(id);
    }
  }

  items2: NostrRelayDocument[] = [];

  async initialize() {
    this.items2 = await this.db.storage.getRelays();

    // If there are no relay metatadata in database, get it from extension or default
    if (this.items2.length == 0) {
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

    for (let index = 0; index < this.items2.length; index++) {
      const relay = this.items2[index];

      if (relay.type === 1) {
        this.createRelayWorker(relay.url);
      }
    }
  }
}
