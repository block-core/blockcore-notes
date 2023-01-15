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
import { mergeNsAndName } from '@angular/compiler';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
  defaultRelays: any = {
    // 'wss://relay.damus.io': { read: true, write: false },
    // 'wss://relay.nostr.info': { read: true, write: true },
    'wss://nostr-pub.wellorder.net': { read: true, write: true },
    'wss://nostr.nordlysln.net': { read: true, write: true },
    'wss://relay.nostr.ch': { read: true, write: true },
    'wss://nostr.v0l.io': { read: true, write: true },
    'wss://nostr-relay.wlvs.space': { read: true, write: true },
    // 'wss://nostrex.fly.dev': { read: true, write: true },
  };

  private get table() {
    return this.db.relays;
  }

  cache = new CacheService();

  items$ = dexieToRx(liveQuery(() => this.list()));

  async list() {
    return await this.table.toArray();
  }

  // #table;

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

  /** These are relay instances that have connection over WebSocket and holds a reference to database metadata for the relay. */
  relays: NostrRelay[] = [];

  #relaysChanged: BehaviorSubject<NostrRelay[]> = new BehaviorSubject<NostrRelay[]>(this.relays);

  get relays$(): Observable<NostrRelay[]> {
    return this.#relaysChanged.asObservable();
  }

  // get events$(): Observable<NostrEventDocument[]> {
  //   return this.#eventsChanged.asObservable().pipe(
  //     map((data) => {
  //       data.sort((a, b) => {
  //         return a.created_at > b.created_at ? -1 : 1;
  //       });

  //       return data;
  //     })
  //   );
  // }

  /** Posts that does not have any e tags and is not filtered on blocks or mutes, returns everyone. */
  // get rootEvents$(): Observable<NostrEventDocument[]> {
  //   return (
  //     this.#rootEventsChanged
  //       .asObservable()
  //       .pipe(
  //         map((data) => {
  //           const filtered = data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
  //           return filtered;
  //         })
  //       ) // If there is any 'e' tags then skip.
  //       // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
  //       .pipe(
  //         map((data) => {
  //           data.sort((a, b) => {
  //             return a.created_at > b.created_at ? -1 : 1;
  //           });

  //           return data;
  //         })
  //       )
  //   );
  // }

  // get replyEvents$(): Observable<NostrEventDocument[]> {
  //   return (
  //     this.#replyEventsChanged
  //       .asObservable()
  //       .pipe(
  //         map((data) => {
  //           return data.filter((events) => events.tags.find((t) => t[0] === 'e'));
  //         })
  //       ) // If there is any 'e' tags then skip.
  //       // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
  //       .pipe(
  //         map((data) => {
  //           data.sort((a, b) => {
  //             if (this.options.options.ascending) {
  //               return a.created_at < b.created_at ? -1 : 1;
  //             } else {
  //               return a.created_at > b.created_at ? -1 : 1;
  //             }
  //           });

  //           return data;
  //         })
  //       )
  //   );
  // }

  // get threadedEvents$(): Observable<NostrEventDocument[]> {
  //   return this.#threadedEventsChanged
  //     .asObservable()
  //     .pipe(
  //       map((data) => {
  //         if (this.options.options.flatfeed) {
  //           return data;
  //           // return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
  //         } else {
  //           return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
  //         }
  //       })
  //     ) // If there is any 'e' tags then skip.
  //     .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
  //     .pipe(
  //       map((data) => {
  //         data.sort((a, b) => {
  //           if (this.options.options.ascending) {
  //             return a.created_at < b.created_at ? -1 : 1;
  //           } else {
  //             return a.created_at > b.created_at ? -1 : 1;
  //           }
  //         });

  //         return data;
  //       })
  //     );
  // }

  // get filteredEvents$(): Observable<NostrEventDocument[]> {
  //   // combineLatest([this.sort$, this.events$])
  //   // combineLatest([this.sort$, this.events$])
  //   //   .pipe(map((sortOrder, data) => data.filter((sortOrder, events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
  //   //   .pipe(
  //   //     map(([sortOrder, data]) => {
  //   //       this.sortOrder = sortOrder;

  //   //       if (sortOrder === 'asc') {
  //   //         return data;
  //   //       } else {
  //   //         return data.reverse();
  //   //       }
  //   //     })
  //   //   );

  //   return this.#filteredEventsChanged
  //     .asObservable()
  //     .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
  //     .pipe(
  //       map((data) => {
  //         data.sort((a, b) => {
  //           return a.created_at > b.created_at ? -1 : 1;
  //         });

  //         return data;
  //       })
  //     );
  // }

  constructor(private db: StorageService, private options: OptionsService, private eventService: EventService, private appState: ApplicationState) {
    // Whenever the visibility becomes visible, run connect to ensure we're connected to the relays.
    this.appState.visibility$.subscribe((visible) => {
      if (visible) {
        this.connect();
      }
    });

    // Every time the list of profiles changes, we will re-sub to have a single subscription against all following:
    // this.profileService.following$.subscribe(() => {
    //   console.log('following$!!!, SUBSCRIBE TO FOLLOWING!');
    //   for (let i = 0; i < this.relays.length; i++) {
    //     this.subscribeToFollowing(this.relays[i]);
    //   }
    // });
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

  // async #persist(event: NostrEventDocument) {
  //   const id = event.id as string;

  //   // TODO: Consider what we're going to do because we push to the array from here and we need ID there.
  //   // Remove the id from the document before we persist.
  //   // delete event.id;

  //   await this.#table.put(id, event);

  //   // Add in the top or bottom, for now at the top. If it already exists, should we update and alert or perhaps we should simply
  //   // ignore? Maybe it was saved with additional metadata, so for now we'll call the update subject.
  //   const eventIndex = this.events.findIndex((e) => e.id == event.id);

  //   if (eventIndex > -1) {
  //     this.events[eventIndex] = event;
  //   } else {
  //     this.events.unshift(event);
  //   }

  //   this.#updated();
  // }

  // async #filter(predicate: (value: NostrEventDocument, key: string) => boolean): Promise<NostrEventDocument[]> {
  //   const iterator = this.#table.iterator<string, NostrEventDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
  //   const items = [];

  //   for await (const [key, value] of iterator) {
  //     if (predicate(value, key)) {
  //       // value.id = key; // NOT NEEDED, we store id with document for this table.
  //       items.unshift(value);
  //       // items.push(value);
  //     }
  //   }

  //   return items;
  // }

  /** Wipes all events. */
  // async wipe() {
  //   for await (const [key, value] of this.#table.iterator({})) {
  //     await this.#table.del(key);
  //   }

  //   this.relays = [];
  //   this.relaysUpdated();
  // }

  /** Returns all events that are persisted. */
  // async followEvents(count: number) {
  //   let counter = 0;

  //   return this.#filter((value, key) => {
  //     counter++;

  //     if (counter <= count) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   });
  // }

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
      await this.table.put({ url: key, write: val.write, read: val.read });
    }

    this.relaysUpdated();
  }

  async appendRelay(url: string, read: boolean, write: boolean) {
    await this.table.put({ url: url, read: read, write: write });
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

  /** Subscribes to the following on the specific relay. */
  // subscribeToFollowing(relay: Relay) {
  //   const profiles = this.profileService.inMemoryFollowList(this.appState.getPublicKey());

  //   console.log('PROFILES:', profiles);

  //   const authors = profiles.map((p) => p.pubkey);

  //   // Just skip subscription if we are not following anyone yet.
  //   if (authors.length === 0) {
  //     console.log('Skipping subscription, zero following.');
  //     return;
  //   }

  //   // Append ourself to the authors list so we receive everything we publish to any relay.
  //   authors.push(this.appState.getPublicKey());

  //   // TODO: We must store last time user closed the application and use that as back in time value.
  //   // const backInTime = moment().subtract(5, 'days').unix();

  //   // Start subscribing to our people feeds. // since: backInTime,
  //   // TODO: MAYBE WE SHOULD UNSUB AND SUB AGAIN, OR WILL THIS OVERRIDE EXISTING SUB?!

  //   const filters = authors.map((a) => {
  //     return { kinds: [1], limit: 500, authors: [a] };
  //   });

  //   const sub = relay.sub(filters, {}) as NostrSubscription;

  //   // If we are still waiting for "loading" after 30 seconds, retry the subscription.
  //   sub.timeout = setTimeout(() => {
  //     console.log('Subscription Timeout Protection was triggered.', sub.loading);

  //     if (sub.loading) {
  //       console.log('Unsubbing and restarting subscription.', relay);

  //       // Make sure we validate against active relay and not an old reference.
  //       let activeRelay = this.getActiveRelay(relay.url);

  //       // Only re-attempt the subscription if we actually have an active connection to this relay.
  //       if (activeRelay && activeRelay.status === 1) {
  //         sub.unsub();
  //         this.subscribeToFollowing(relay);
  //       }
  //     }
  //   }, 5 * 60 * 1000);

  //   sub.loading = true;

  //   // Keep all subscriptions around so we can close them when needed.
  //   this.subs.push(sub);

  //   sub.on('event', (originalEvent: any) => {
  //     const event = this.eventService.processEvent(originalEvent);

  //     if (!event) {
  //       return;
  //     }

  //     this.#persist(event);
  //   });

  //   sub.on('eose', () => {
  //     console.log('Initial load of people feed completed.');
  //     sub.loading = false;
  //   });
  // }

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

// import { Injectable } from '@angular/core';
// import { NostrEventDocument, NostrSubscription, NostrRelay, NostrRelayDocument } from './interfaces';
// import { Observable, BehaviorSubject, map } from 'rxjs';
// import { Relay, relayInit, Sub } from 'nostr-tools';
// import { ProfileService } from './profile.service';
// import { CirclesService } from './circles.service';
// import * as moment from 'moment';
// import { EventService } from './event.service';
// import { DataValidation } from './data-validation.service';
// import { OptionsService } from './options.service';
// import { RelayStorageService } from './relay.storage.service';
// import { AuthenticationService } from './authentication.service';
// import { ApplicationState } from './applicationstate.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class RelayService {
//   /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
//   defaultRelays: any = {
//     // 'wss://relay.damus.io': { read: true, write: false },
//     'wss://nostr-pub.wellorder.net': { read: true, write: true },
//     // 'wss://relay.nostr.info': { read: true, write: true },
//     'wss://nostr.nordlysln.net': { read: true, write: true },
//     'wss://relay.nostr.ch': { read: true, write: true },
//     'wss://nostr.v0l.io': { read: true, write: true },
//     'wss://nostr-relay.wlvs.space': { read: true, write: true },
//   };

//   // #table;

//   // #relayTable;

//   events: NostrEventDocument[] = [];

//   #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);

//   #filteredEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

//   #threadedEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

//   #rootEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

//   #replyEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

//   sortSubject = new BehaviorSubject<'asc' | 'desc'>('asc');
//   sort$ = this.sortSubject.asObservable();
//   sortOrder: 'asc' | 'desc' = 'asc';

//   subs: Sub[] = [];

//   /** These are relay instances that have connection over WebSocket and holds a reference to database metadata for the relay. */
//   relays: NostrRelay[] = [];

//   #relaysChanged: BehaviorSubject<NostrRelay[]> = new BehaviorSubject<NostrRelay[]>(this.relays);

//   get relays$(): Observable<NostrRelay[]> {
//     return this.#relaysChanged.asObservable();
//   }

//   get events$(): Observable<NostrEventDocument[]> {
//     return this.#eventsChanged.asObservable().pipe(
//       map((data) => {
//         data.sort((a, b) => {
//           return a.created_at > b.created_at ? -1 : 1;
//         });

//         return data;
//       })
//     );
//   }

//   /** Posts that does not have any e tags and is not filtered on blocks or mutes, returns everyone. */
//   get rootEvents$(): Observable<NostrEventDocument[]> {
//     return (
//       this.#rootEventsChanged
//         .asObservable()
//         .pipe(
//           map((data) => {
//             const filtered = data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
//             return filtered;
//           })
//         ) // If there is any 'e' tags then skip.
//         // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
//         .pipe(
//           map((data) => {
//             data.sort((a, b) => {
//               return a.created_at > b.created_at ? -1 : 1;
//             });

//             return data;
//           })
//         )
//     );
//   }

//   get replyEvents$(): Observable<NostrEventDocument[]> {
//     return (
//       this.#replyEventsChanged
//         .asObservable()
//         .pipe(
//           map((data) => {
//             return data.filter((events) => events.tags.find((t) => t[0] === 'e'));
//           })
//         ) // If there is any 'e' tags then skip.
//         // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
//         .pipe(
//           map((data) => {
//             data.sort((a, b) => {
//               if (this.options.options.ascending) {
//                 return a.created_at < b.created_at ? -1 : 1;
//               } else {
//                 return a.created_at > b.created_at ? -1 : 1;
//               }
//             });

//             return data;
//           })
//         )
//     );
//   }

//   get threadedEvents$(): Observable<NostrEventDocument[]> {
//     return (
//       this.#threadedEventsChanged
//         .asObservable()
//         .pipe(
//           map((data) => {
//             if (this.options.options.flatfeed) {
//               return data;
//               // return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
//             } else {
//               return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
//             }
//           })
//         ) // If there is any 'e' tags then skip.
//         // TODO: FIX FILTER OF BLOCKED!
//         // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
//         .pipe(
//           map((data) => {
//             data.sort((a, b) => {
//               if (this.options.options.ascending) {
//                 return a.created_at < b.created_at ? -1 : 1;
//               } else {
//                 return a.created_at > b.created_at ? -1 : 1;
//               }
//             });

//             return data;
//           })
//         )
//     );
//   }

//   get filteredEvents$(): Observable<NostrEventDocument[]> {
//     // combineLatest([this.sort$, this.events$])
//     // combineLatest([this.sort$, this.events$])
//     //   .pipe(map((sortOrder, data) => data.filter((sortOrder, events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
//     //   .pipe(
//     //     map(([sortOrder, data]) => {
//     //       this.sortOrder = sortOrder;

//     //       if (sortOrder === 'asc') {
//     //         return data;
//     //       } else {
//     //         return data.reverse();
//     //       }
//     //     })
//     //   );

//     return (
//       this.#filteredEventsChanged
//         .asObservable()
//         // TODO: FIX FILTER OF BLOCKED!
//         // .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey) && !this.profileService.mutedPublicKeys().includes(events.pubkey))))
//         .pipe(
//           map((data) => {
//             data.sort((a, b) => {
//               return a.created_at > b.created_at ? -1 : 1;
//             });

//             return data;
//           })
//         )
//     );
//   }

//   constructor(public relayStorage: RelayStorageService, private options: OptionsService, private eventService: EventService, private profileService: ProfileService, private appState: ApplicationState) {
//     // this.#table = this.storage.table<NostrEventDocument>('events');
//     // this.#relayTable = this.storage.table<any>('relays');

//     // Whenever the visibility becomes visible, run connect to ensure we're connected to the relays.
//     this.appState.visibility$.subscribe((visible) => {
//       console.log('VISIBILITY CHANGED:', visible);

//       if (visible) {
//         this.connect();
//       }
//     });

//     // Every time the list of profiles changes, we will re-sub to have a single subscription against all following:
//     this.profileService.following$.subscribe(() => {
//       console.log('following$!!!, SUBSCRIBE TO FOLLOWING!');
//       for (let i = 0; i < this.relays.length; i++) {
//         this.subscribeToFollowing(this.relays[i]);
//       }
//     });
//   }

//   getActiveRelay(url: string) {
//     const index = this.relays.findIndex((r) => r.url == url);

//     if (index == -1) {
//       return null;
//     } else {
//       return this.relays[index];
//     }
//   }

//   /** Add an in-memory instance of relay and get stored metadata for it. */
//   async addRelay(relay: NostrRelay) {
//     const index = this.relays.findIndex((r) => r.url == relay.url);

//     if (index == -1) {
//       this.relays.push(relay);
//     } else {
//       // First initiate a close and then replace it.
//       // Attempting to not close existing connections, there is no point in doing so.
//       // this.relays[index].close();
//       this.relays[index] = relay;
//     }

//     try {
//       const url = new URL(relay.url);
//       const infoUrl = `https://${url.hostname}`;

//       const rawResponse = await fetch(infoUrl, {
//         method: 'GET',
//         mode: 'cors',
//         headers: {
//           Accept: 'application/nostr+json',
//         },
//       });

//       if (rawResponse.status === 200) {
//         const content = await rawResponse.json();

//         relay.metadata.nip11 = content;
//       } else {
//         relay.metadata.error = `Unable to get NIP-11 data. Status: ${rawResponse.statusText}`;
//       }
//     } catch (err) {
//       console.warn(err);
//       relay.metadata.error = `Unable to get NIP-11 data. Status: ${err}`;
//     }

//     // Persist the latest NIP11 metadata on the NostrRelayDocument.
//     await this.relayStorage.put(relay.metadata);

//     this.relaysUpdated();
//   }

//   #updated() {
//     this.#eventsChanged.next(this.events);
//     this.#filteredEventsChanged.next(this.events);
//     this.#threadedEventsChanged.next(this.events);
//     this.#rootEventsChanged.next(this.events);
//     this.#replyEventsChanged.next(this.events);
//   }

//   async #persist(event: NostrEventDocument) {
//     const id = event.id as string;

//     // TODO: Consider what we're going to do because we push to the array from here and we need ID there.
//     // Remove the id from the document before we persist.
//     // delete event.id;

//     await this.#table.put(id, event);

//     // Add in the top or bottom, for now at the top. If it already exists, should we update and alert or perhaps we should simply
//     // ignore? Maybe it was saved with additional metadata, so for now we'll call the update subject.
//     const eventIndex = this.events.findIndex((e) => e.id == event.id);

//     if (eventIndex > -1) {
//       this.events[eventIndex] = event;
//     } else {
//       this.events.unshift(event);
//     }

//     this.#updated();
//   }

//   async #filter(predicate: (value: NostrEventDocument, key: string) => boolean): Promise<NostrEventDocument[]> {
//     const iterator = this.#table.iterator<string, NostrEventDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
//     const items = [];

//     for await (const [key, value] of iterator) {
//       if (predicate(value, key)) {
//         // value.id = key; // NOT NEEDED, we store id with document for this table.
//         items.unshift(value);
//         // items.push(value);
//       }
//     }

//     return items;
//   }

//   /** Wipes all events. */
//   async wipe() {
//     for await (const [key, value] of this.#table.iterator({})) {
//       await this.#table.del(key);
//     }

//     this.relays = [];
//     this.relaysUpdated();
//   }

//   /** Returns all events that are persisted. */
//   async followEvents(count: number) {
//     let counter = 0;

//     return this.#filter((value, key) => {
//       counter++;

//       if (counter <= count) {
//         return true;
//       } else {
//         return false;
//       }
//     });
//   }

//   /** Takes relay in the format used for extensions and adds to persistent storage. This method does not connect to relays. */
//   async appendRelays(relays: any) {
//     let preparedRelays = relays;

//     if (Array.isArray(preparedRelays)) {
//       preparedRelays = {};

//       for (let i = 0; i < relays.length; i++) {
//         preparedRelays[relays[i]] = { read: true, write: true };
//       }
//     }

//     const entries = Object.keys(preparedRelays);

//     for (var i = 0; i < entries.length; i++) {
//       const key = entries[i];
//       const val = preparedRelays[key];
//       await this.relayStorage.put({ id: key, write: val.write, read: val.read });
//     }

//     this.relaysUpdated();
//   }

//   async appendRelay(url: string, read: boolean, write: boolean) {
//     await this.relayStorage.put({ id: url, read: read, write: write });
//     this.relaysUpdated();
//   }

//   relaysUpdated() {
//     this.#relaysChanged.next(this.relays);
//   }

//   /** Takes relay in the format used for extensions and adds to persistent storage. This method does not connect to relays. */
//   async deleteRelay(url: string) {
//     await this.relayStorage.delete(url);

//     const relayIndex = this.relays.findIndex((r) => r.url == url);
//     let existingRelayInstance = this.relays.splice(relayIndex, 1);

//     // Disconnect from the relay when we delete it.
//     if (existingRelayInstance.length > 0) {
//       existingRelayInstance[0].close();
//     }

//     this.relaysUpdated();
//   }

//   connectedRelays() {
//     return this.relays.filter((r) => r.status === 1);
//   }

//   connect() {
//     for (var i = 0; i < this.relayStorage.items.length; i++) {
//       const entry = this.relayStorage.items[i];

//       const existingConnection = this.relays.find((r) => r.url == entry.id);

//       console.log('FOUND EXISTING CONNECTION:', existingConnection);

//       // If we are already connected, skip opening connection again.
//       if (existingConnection && existingConnection.status == 1) {
//         continue;
//       }

//       console.log('Opening connection to:', entry);
//       this.openConnection(entry);
//     }
//   }

//   async reset() {
//     console.log('RESET RUNNING!');
//     for (var i = 0; i < this.relays.length; i++) {
//       const relay = this.relays[i];
//       relay.close();
//     }

//     this.subs = [];
//     this.relays = [];

//     await this.relayStorage.wipe();

//     this.relaysUpdated();

//     console.log('THERE ARE NO RELAYS:', this.relays);
//   }

//   async #connectToRelay(server: NostrRelayDocument, onConnected: any) {
//     const existingActiveRelay = this.getActiveRelay(server.id);

//     // If the relay already exists, just return that and do nothing else.
//     if (existingActiveRelay) {
//       onConnected(existingActiveRelay);
//     }

//     // const relay = relayInit('wss://relay.nostr.info');
//     const relay = relayInit(server.id) as NostrRelay;

//     relay.on('connect', () => {
//       // console.log(`connected to ${relay?.url}`);
//       onConnected(relay);
//       //this.onConnected(relay);
//     });

//     relay.on('disconnect', () => {
//       console.log(`DISCONNECTED! ${relay?.url}`);
//     });

//     relay.on('notice', (msg: any) => {
//       console.log(`NOTICE FROM ${relay?.url}: ${msg}`);
//     });

//     // Keep a reference of the metadata on the relay instance.
//     relay.metadata = server;

//     try {
//       await relay.connect();
//     } catch (err) {
//       console.log(err);
//       relay.metadata.error = 'Unable to connect.';
//     }

//     await this.addRelay(relay);

//     return relay;
//   }

//   openConnection(server: NostrRelayDocument) {
//     this.#connectToRelay(server, (relay: Relay) => {
//       console.log('Connected to:', relay.url);

//       // When finished, trigger an observable that we are connected.
//       this.appState.connected(true);

//       this.subscribeToFollowing(relay);
//     });
//   }

//   subscriptions: any = {};

//   /** Subscribes to the following on the specific relay. */
//   subscribeToFollowing(relay: Relay) {
//     const profiles = this.profileService.inMemoryFollowList(this.appState.getPublicKey());

//     console.log('PROFILES:', profiles);

//     const authors = profiles.map((p) => p.pubkey);

//     // Just skip subscription if we are not following anyone yet.
//     if (authors.length === 0) {
//       console.log('Skipping subscription, zero following.');
//       return;
//     }

//     // Append ourself to the authors list so we receive everything we publish to any relay.
//     authors.push(this.appState.getPublicKey());

//     // TODO: We must store last time user closed the application and use that as back in time value.
//     // const backInTime = moment().subtract(5, 'days').unix();

//     // Start subscribing to our people feeds. // since: backInTime,
//     // TODO: MAYBE WE SHOULD UNSUB AND SUB AGAIN, OR WILL THIS OVERRIDE EXISTING SUB?!

//     const filters = authors.map((a) => {
//       return { kinds: [1], limit: 500, authors: [a] };
//     });

//     const sub = relay.sub(filters, {}) as NostrSubscription;

//     // If we are still waiting for "loading" after 30 seconds, retry the subscription.
//     sub.timeout = setTimeout(() => {
//       console.log('Subscription Timeout Protection was triggered.', sub.loading);

//       if (sub.loading) {
//         console.log('Unsubbing and restarting subscription.', relay);

//         // Make sure we validate against active relay and not an old reference.
//         let activeRelay = this.getActiveRelay(relay.url);

//         // Only re-attempt the subscription if we actually have an active connection to this relay.
//         if (activeRelay && activeRelay.status === 1) {
//           sub.unsub();
//           this.subscribeToFollowing(relay);
//         }
//       }
//     }, 5 * 60 * 1000);

//     sub.loading = true;

//     // Keep all subscriptions around so we can close them when needed.
//     this.subs.push(sub);

//     sub.on('event', (originalEvent: any) => {
//       const event = this.eventService.processEvent(originalEvent);

//       if (!event) {
//         return;
//       }

//       this.#persist(event);
//     });

//     sub.on('eose', () => {
//       console.log('Initial load of people feed completed.');
//       sub.loading = false;
//     });
//   }

//   async initialize() {
//     // If there are no relay metatadata in database, get it from extension or default
//     if (this.relayStorage.items.length === 0) {
//       let relays;

//       try {
//         const gt = globalThis as any;
//         relays = await gt.nostr.getRelays();
//       } catch (err) {
//         relays = this.defaultRelays;
//       }

//       // First append whatever the extension give us of relays.
//       await this.appendRelays(relays);
//     }
//   }
// }
