import { Injectable } from '@angular/core';
import { NostrEvent, NostrProfile, NostrEventDocument, NostrProfileDocument, Circle, Person, NostrSubscription, NostrRelay } from './interfaces';
import * as sanitizeHtml from 'sanitize-html';
import { SettingsService } from './settings.service';
import { tap, delay, timer, takeUntil, timeout, Observable, of, BehaviorSubject, map, combineLatest, single, Subject, Observer, concat, concatMap, switchMap, catchError, race } from 'rxjs';
import { Relay, relayInit, Sub } from 'nostr-tools';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { CirclesService } from './circles.service';
import * as moment from 'moment';
import { EventService } from './event.service';
import { DataValidation } from './data-validation.service';
import { OptionsService } from './options.service';
import { RelayService } from './relay.service';
import { RelayStorageService } from './relay.storage.service';

@Injectable({
  providedIn: 'root',
})
export class FeedService {
  #table;

  events: NostrEventDocument[] = [];

  event: NostrEventDocument | null = null;

  #eventChanged: BehaviorSubject<NostrEventDocument | null> = new BehaviorSubject<NostrEventDocument | null>(this.event);

  #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);

  // #filteredEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  // #threadedEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  // #rootEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  // #replyEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>([]);

  sortSubject = new BehaviorSubject<'asc' | 'desc'>('asc');
  sort$ = this.sortSubject.asObservable();
  sortOrder: 'asc' | 'desc' = 'asc';

  subs: Sub[] = [];
  // relays: Relay[] = [];
  // events$ = this.#eventsChanged.asObservable();

  eventId: string = '';

  get event$(): Observable<NostrEventDocument | null> {
    return this.#eventChanged.asObservable();
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

  // get events$(): Observable<NostrEventDocument[]> {
  //   return this.#eventsChanged.asObservable();
  // }

  /** Posts that does not have any e tags and is not filtered on blocks or mutes, returns everyone. */
  get rootEvents$(): Observable<NostrEventDocument[]> {
    return this.events$.pipe(
      map((data) => {
        const filtered = data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
        return filtered;
      })
    );
  }

  get replyEvents$(): Observable<NostrEventDocument[]> {
    return this.events$.pipe(
      map((data) => {
        return data.filter((events) => events.tags.find((t) => t[0] === 'e'));
      })
    );
  }

  get threadedEvents$(): Observable<NostrEventDocument[]> {
    return this.events$.pipe(
      map((data) => {
        if (this.options.options.flatfeed) {
          return data;
          // return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
        } else {
          return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
        }
      })
    );
  }

  get muted$(): Observable<NostrEventDocument[]> {
    return this.events$.pipe(map((data) => data.filter((events) => !this.profileService.mutedPublicKeys().includes(events.pubkey)))).pipe(
      map((data) => {
        data.sort((a, b) => {
          return a.created_at > b.created_at ? -1 : 1;
        });

        return data;
      })
    );
  }

  /** Returns all events except those blocked. Blocked events will never be shown. */
  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged
      .asObservable()
      .pipe(
        map((data) => {
          data.sort((a, b) => {
            return a.created_at > b.created_at ? -1 : 1;
          });

          return data;
        })
      )
      .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey))));
  }

  constructor(
    private options: OptionsService,
    private relayStorage: RelayStorageService,
    private relayService: RelayService,
    private eventService: EventService,
    private validator: DataValidation,
    private storage: StorageService,
    private profileService: ProfileService,
    private circlesService: CirclesService
  ) {
    console.log('FEED SERVICE CONSTRUCTOR!');
    this.#table = this.storage.table<NostrEventDocument>('events');
  }

  #eventUpdated() {
    this.#eventChanged.next(this.event);
  }

  #eventsUpdated() {
    this.#eventsChanged.next(this.events);
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

    this.#eventsUpdated();
  }

  async setActiveEvent(eventId: string) {
    console.log('Set Active Event:', eventId);

    const items = await this.#filter((value) => {
      return value.id == eventId;
    });

    console.log('FOUND:', items);

    if (items.length === 0) {
      // If we don't have the event, go download it.
      // this.downloadEvent([eventId]);
      this.event = null;
    } else {
      this.event = items[0];
    }

    console.log('FOUND WHAT AND EXECUT CHANGED:', this.event);

    this.#eventUpdated();
    // this.#eventChanged.next(this.event);
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
    this.event = null;

    this.#eventsUpdated();
    this.#eventUpdated();
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

  // public subscribe<T>(key: string): Observable<EventBusMetaData> {
  //   return this.eventBus.asObservable().pipe(
  //     filter((event: IEventBusMessage) => this.keyMatch(event.key, key)),
  //     map((event: IEventBusMessage) => event.metadata)
  //   );
  // }

  getEvent(id: string): Observable<NostrEventDocument> {
    const subject = new Subject<NostrEventDocument>();
    return subject.asObservable();
  }

  // downloadFromRelayIndex(id: string, index: number, relayCount: number): Observable<NostrEventDocument> {
  downloadFromRelay(query: any, relay: NostrRelay): Observable<NostrEventDocument[]> {
    //const relay = this.relayService.relays[index];
    //console.log('downloadFromRelayIndex:', id, index, relayCount);

    const observable = new Observable<NostrEventDocument[]>((observer: Observer<NostrEventDocument[]>) => {
      const totalEvents: NostrEventDocument[] = [];

      const sub = relay.sub([query], {}) as NostrSubscription;

      sub.on('event', (originalEvent: any) => {
        // console.log('downloadFromRelayIndex: event', id);
        const event = this.eventService.processEvent(originalEvent);
        // console.log('downloadFromRelayIndex: event', event);

        if (!event) {
          return;
        }

        totalEvents.unshift(event);
        observer.next(totalEvents);
        // sub.unsub();
      });

      sub.on('eose', () => {
        // console.log('downloadFromRelayIndex: eose', id);
        observer.complete();
        sub.unsub();
      });
    });
    // .pipe(race(observable, this.downloadFromRelayIndex(id, index, relayCount)))
    // // .pipe(takeUntil(timer(5)), tap(() => { console.log('TAKE UNTIL TAP!') }))
    //   .pipe(
    //     // tap(() => { console.log('CONTINUED HAPPENED, SWITCH MAP AND DOWNLOAD AGAIN!') }),
    //     // timeout(5000),
    //     // catchError(error => of("Error while request"))
    //     // takeUntil(myTimer),
    //     switchMap((data) => {
    //       ++index;
    //       console.log('DATA FROM SWITCH MAP:', data);
    //       return data ? of(data) : this.downloadFromRelayIndex(id, index, relayCount);
    //     })
    //   );

    // .pipe(concatMap(event => {
    //   if (event == null) {
    //     ++index;

    //     if (index < relayCount) {
    //       return this.downloadFromRelayIndex(id, index, relayCount));
    //       // return ;
    //     }
    //   }
    // });

    return observable;
  }

  // downloadFromRelayIndex(id: string, index: number, relayCount: number): Observable<NostrEventDocument> {
  downloadSingleFromRelay(query: any, relay: NostrRelay): Observable<NostrEventDocument> {
    //const relay = this.relayService.relays[index];
    //console.log('downloadFromRelayIndex:', id, index, relayCount);

    const observable = new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
      const sub = relay.sub([query], {}) as NostrSubscription;

      sub.on('event', (originalEvent: any) => {
        // console.log('downloadFromRelayIndex: event', id);
        const event = this.eventService.processEvent(originalEvent);
        // console.log('downloadFromRelayIndex: event', event);

        if (!event) {
          return;
        }

        observer.next(event);
        observer.complete();
        // sub.unsub();
      });

      sub.on('eose', () => {
        // console.log('downloadFromRelayIndex: eose', id);
        // observer.complete();
        sub.unsub();
      });
    });
    // .pipe(race(observable, this.downloadFromRelayIndex(id, index, relayCount)))
    // // .pipe(takeUntil(timer(5)), tap(() => { console.log('TAKE UNTIL TAP!') }))
    //   .pipe(
    //     // tap(() => { console.log('CONTINUED HAPPENED, SWITCH MAP AND DOWNLOAD AGAIN!') }),
    //     // timeout(5000),
    //     // catchError(error => of("Error while request"))
    //     // takeUntil(myTimer),
    //     switchMap((data) => {
    //       ++index;
    //       console.log('DATA FROM SWITCH MAP:', data);
    //       return data ? of(data) : this.downloadFromRelayIndex(id, index, relayCount);
    //     })
    //   );

    // .pipe(concatMap(event => {
    //   if (event == null) {
    //     ++index;

    //     if (index < relayCount) {
    //       return this.downloadFromRelayIndex(id, index, relayCount));
    //       // return ;
    //     }
    //   }
    // });

    return observable;
  }

  downloadThread(id: string) {
    // TODO: Change the logic to create a new observable for each X milisecond and make them
    // race against each other and don't create more observables if a result is found.
    const observables = this.relayService.relays.map((r, index) => this.downloadFromRelay({ ['#e']: [id] }, r));
    return race(observables);
  }

  downloadEvent(id: string) {
    // TODO: Change the logic to create a new observable for each X milisecond and make them
    // race against each other and don't create more observables if a result is found.
    const observables = this.relayService.relays.map((r, index) => this.downloadSingleFromRelay({ kinds: [1], ids: [id] }, r));
    return race(observables);

    // const observable = new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
    //   const observables = this.relayService.relays.map((r => { this.downloadFromRelayIndex(id, r); }));
    //   race(observables);
    //      // for (let i = 0; i < this.relayService.relays.length; i++) {
    //   //   const relay = this.relayService.relays[i];

    //   //   if (relay.status != 1) {
    //   //     continue;
    //   //   }

    //   //   this.downloadFromRelay(id, relay);
    //   // }

    //   // this.downloadFromRelayIndex(id, 0, this.relayService.relays.length).subscribe((event) => {
    //   //   console.log('FINIHED DOWNLOAD OBSERSVABLE:', event);
    //   //   observer.next(event);
    //   // });

    //   // this.downloadFromRelayIndex(id, 0);

    //   // const relayIndex = 0;

    //   // const relay = this.relayService.relays[0];

    //   // this.downloadFromRelay(id, relay).subscribe((event) => {
    //   //   console.log('COMPLETED FIRST DOWNLAOD FROM RELAY:', event);
    //   // });

    //   // for (let i = 0; i < this.relayService.relays.length; i++) {
    //   //   const relay = this.relayService.relays[i];

    //   //   if (relay.status != 1) {
    //   //     continue;
    //   //   }

    //   //   this.downloadFromRelay(id, relay);
    //   // }

    //   // console.log('DOWNLOAD EVENT:', id);
    //   // const relay = this.relayService.relays[0];

    //   // // Start subscribing to our people feeds.
    //   // const sub = relay.sub([{ kinds: [1], ids: [id] }], {}) as NostrSubscription;

    //   // // Keep all subscriptions around so we can close them when needed.
    //   // // this.subs.push(sub);

    //   // sub.on('event', (originalEvent: any) => {
    //   //   const event = this.eventService.processEvent(originalEvent);

    //   //   if (!event) {
    //   //     return;
    //   //   }

    //   //   downloadedEvent = event;
    //   //   observer.next(event);
    //   //   // this.#persist(event);
    //   // });

    //   // sub.on('eose', () => {
    //   //   console.log('Initial load of people feed completed.');
    //   //   // const subIndex = this.subs.findIndex(sub);
    //   //   if (downloadedEvent) {
    //   //     observer.complete();
    //   //     sub.unsub();
    //   //   } else {
    //   //     // Go to next relay and try there.
    //   //     // First let us unsub the current subscription.
    //   //     sub.unsub();
    //   //   }
    //   // });
    // });

    // return observable;

    // get rootEvents$(): Observable<NostrEventDocument[]> {
    //   return this.events$.pipe(
    //     map((data) => {
    //       const filtered = data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
    //       return filtered;
    //     })
    //   );
    // }

    // this.relayStorage.list();
  }

  async downloadRecent(pubkeys: string[]) {
    console.log('DOWNLOAD RECENT FOR:', pubkeys);
    const relay = this.relayService.relays[0];

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

  downloadThread2(id: string) {
    // First get existing data.
    // this.#filter((e) => { e.tags. });

    const relay = this.relayService.relays[0];

    if (!relay) {
      // Queue the event.
      setTimeout(() => {
        this.downloadThread(id);
      }, 1000);
      return;
    }

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
  //   this.fetchProfiles(this.relayService.relays[0], pubkeys);
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

  async initialize() {
    // Whenever the profile service needs to get a profile from the network, this event is triggered.
    // this.profileService.profileRequested$.subscribe(async (pubkey) => {
    //   if (!pubkey) {
    //     return;
    //   }

    //   await this.downloadProfile(pubkey);
    // });

    // TODO: Use rxjs to trigger the queue to process and then complete, don't do this setInterval.
    // this.scheduleProfileDownload();

    // Populate the profile observable.
    // await this.profileService.populate();

    // Load all persisted events. This will of course be too many as user get more and more... so
    // this must be changed into a filter ASAP. Two filters are needed: "Current View" which allows scrolling back in time,
    // and an initial load which should likely just return top 100?
    this.events = await this.followEvents(200);

    this.#eventsUpdated();

    // Every time profiles are updated, we must change our profile subscription.
    // this.profileService.profiles$.subscribe((profiles) => {
    //   console.log('Profiles changed:', profiles);
    // });

    // this.openConnection('wss://nostr-pub.wellorder.net');
    // this.openConnection('wss://nostr-pub2.wellorder.net');
    // this.openConnection('wss://relay.damus.io');
  }

  // openConnection(server: string) {
  //   this.connect(server, (relay: Relay) => {
  //     console.log('Connected to:', relay);

  //     const authors = this.profileService.profiles.map((p) => p.pubkey);

  //     if (authors.length === 0) {
  //       console.log('No profiles found. Skipping subscribing to any data.');
  //       return;
  //     }

  //     const backInTime = moment().subtract(120, 'minutes').unix();

  //     // Start subscribing to our people feeds.
  //     const sub = relay.sub([{ kinds: [1], since: backInTime, authors: authors }], {}) as NostrSubscription;

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
  //   });
  // }

  // connect(server: string, onConnected: any) {
  //   // const relay = relayInit('wss://relay.nostr.info');
  //   const relay = relayInit(server);

  //   relay.on('connect', () => {
  //     console.log(`connected to ${relay?.url}`);
  //     onConnected(relay);
  //     //this.onConnected(relay);
  //   });

  //   relay.on('disconnect', () => {
  //     console.log(`DISCONNECTED! ${relay?.url}`);
  //   });

  //   relay.on('notice', () => {
  //     console.log(`NOTICE FROM ${relay?.url}`);
  //   });

  //   relay.connect();

  //   this.relayService.addRelay(relay);

  //   return relay;
  // }
}
