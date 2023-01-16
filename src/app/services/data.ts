import { Injectable } from '@angular/core';
import { NostrEvent, NostrEventDocument, NostrProfileDocument, NostrRelay, NostrSubscription, QueryJob } from './interfaces';
import { ProfileService } from './profile';
import * as moment from 'moment';
import { EventService } from './event';
import { RelayService } from './relay';
import { Filter, Relay, Event, getEventHash, validateEvent, verifySignature, Kind } from 'nostr-tools';
import { DataValidation } from './data-validation';
import { ApplicationState } from './applicationstate';
import { timeout, map, merge, Observable, delay, Observer, race, take, switchMap, mergeMap, tap, finalize, concatMap, mergeAll, exhaustMap, catchError, of, combineAll, combineLatestAll, filter, from } from 'rxjs';
import { Utilities } from './utilities';
import { StorageService } from './storage';
import { QueueService } from './queue';
import { UIService } from './ui';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  daysToKeepProfiles = 14;
  cleanProfileInterval = 1000 * 60 * 60; // Every hour
  //downloadProfileInterval = 1000 * 3; // Every 3 seconds
  // downloadProfileInterval = 500;
  profileBatchSize = 20;
  refreshUserProfile = 1000 * 60 * 60 * 2; // Every second hour
  connected = false;

  // Observable that can be merged with to avoid performing calls unless we have connected to relays.
  connected$ = this.appState.connected$.pipe(map((status) => status === true));

  constructor(
    private ui: UIService,
    private storage: StorageService,
    private queueService: QueueService,
    private profileService: ProfileService,
    private appState: ApplicationState,
    private utilities: Utilities,
    private validator: DataValidation,
    private eventService: EventService,
    private relayService: RelayService
  ) {
    // We use a global observable for the connected state to avoid having many subscriptions and we'll skip processing until this is true.
    this.appState.connected$.subscribe((connected) => {
      console.log('Connection state changed: ', connected);
      this.connected = connected;

      if (this.connected) {
        console.log('Connection established, start processing queues.');
        this.processQueues();
      }
    });

    // Schedule a timeout whenever the queues has been triggered, to wait for additional items that might arrive in a loop.
    this.queueService.queues$.subscribe(() => {
      setTimeout(() => {
        this.processQueues();
      }, 250);
    });

    // Whenever the profile service needs to get a profile from the network, this event is triggered.
    // this.profileService.profileRequested$.subscribe(async (pubkey) => {
    //   if (!pubkey) {
    //     return;
    //   }
    //   console.log('PROFILE REQUESTED:', pubkey);
    //   await this.downloadProfile(pubkey);
    // });
  }

  async initialize() {
    setTimeout(async () => {
      await this.cleanProfiles();
    }, this.cleanProfileInterval);

    // setTimeout(async () => {
    //   await this.downloadProfiles();
    // }, this.downloadProfileInterval);

    // On set interval, add the user's own profile to download.
    // setTimeout(async () => {
    //   this.profileQueue.push(this.appState.getPublicKey());
    // }, this.refreshUserProfile);

    // If at startup we don't have the logged on user profile, queue it up for retreival.
    // When requesting the profile, it will be auto-requested from relays.
    // setTimeout(async () => {
    //   await this.profileService.getProfile(this.appState.getPublicKey());
    // }, 2000);
  }

  // async downloadProfiles() {
  //   console.log('downloadProfiles!!');
  //   this.processProfilesQueue();

  //   setTimeout(async () => {
  //     console.log('Download Profiles Interval');
  //     await this.downloadProfiles();
  //   }, this.downloadProfileInterval);
  // }

  isFetching = false;
  profileQueue: string[] = [];
  queue: QueryJob[] = [];

  /** Enques a job to be processed against connected relays. */
  enque(job: QueryJob) {
    // It is way more optimal to just delegate jobs into separate queues when enquing than querying later.
    if (job.type == 'Profile') {
      this.queueService.queues.profile.jobs.push(job);
    } else if (job.type == 'Contacts') {
      this.queueService.queues.contacts.jobs.push(job);
    } else if (job.type == 'Event') {
      this.queueService.queues.event.jobs.push(job);
    } else {
      throw Error(`This type of job (${job.type}) is currently not supported.`);
    }

    // We always delay the processing in case we receive
    setTimeout(() => {
      this.processQueues();
    }, 100);
  }

  /**
   * Since most relays limits at 10 we must ensure we don't go above that.
   * 1 reserved for profile retrieval and we queue up maximum 50 on each in batches.
   * 1 reserved for live public feed.
   * 1 reserved for current profile feed.
   * 1 reserved for logged on user feed.
   * ...
   */

  processQueues() {
    if (!this.connected) {
      console.warn('Cannot process queues, no connection to relays.');
      return;
    }

    if (this.queueService.queues.profile.jobs.length > 0) {
      this.processProfileQueue();
    }

    if (this.queueService.queues.contacts.jobs.length > 0) {
      this.processContactsQueue();
    }

    if (this.queueService.queues.event.jobs.length > 0) {
      this.processEventQueue();
    }
  }

  processEventQueue() {
    if (this.queueService.queues.event.active) {
      console.log('Events are already active... Skipping.');
      return;
    }

    const jobs = this.queueService.queues.event.jobs.splice(0, 10);
    const filters = jobs.map((j) => {
      return {
        kinds: [1],
        authors: [j.identifier],
        limit: j.limit,
      } as Filter;
    });

    return this.downloadNewestEventsByQuery(filters).subscribe(async (event) => {
      if (!event) {
        return;
      }

      // If we are following this user, we'll persist this event.
      const following = this.profileService.isFollowing(event.pubkey);
      if (following) {
        await this.storage.events.put(event, event.id);
      }

      for (let i = 0; i < jobs.length; i++) {
        if (jobs[i].callback) {
          jobs[i].callback(event);
        }
      }

      // this.ui.putEvent(event);
    });

    // this.downloadNewestEvents()
    // this.downloadNewestEventsByQuery()
    // this.downloadEventsByQuery("", );
    // this.feedSubscription = this.dataService.downloadNewestEventsByQuery([{ kinds: [1], authors: [pubkey], limit: 100 }]).subscribe((event) => {
  }

  processProfileQueue() {
    console.log('processProfileQueue');
    // If already active, just skip processing for now.
    if (this.queueService.queues.profile.active) {
      console.log('processProfileQueue: skip');
      return;
    }

    // Grab a batch of jobs.
    const jobs = this.queueService.queues.profile.jobs.splice(0, 50);
    const pubkeys = jobs.map((j) => j.identifier);

    console.log('processProfileQueue: pubkeys', pubkeys);

    // Download the profiles that was queued up.
    this.downloadNewestProfiles(pubkeys, 10000, pubkeys.length).subscribe(async (event) => {
      // const e = await event;
      console.log('processProfileQueue: event', event);

      if (!event) {
        return;
      }

      // Make sure we run update and not put whenever we download the latest profile.
      await this.profileService.updateProfile(event.pubkey, event);

      for (let i = 0; i < jobs.length; i++) {
        if (jobs[i].callback) {
          jobs[i].callback(event);
        }
      }
    });
  }

  processContactsQueue() {
    console.log('processContactsQueue');
    // If already active, just skip processing for now.
    if (this.queueService.queues.contacts.active) {
      console.log('processContactsQueue: skip');
      return;
    }

    this.queueService.queues.contacts.active = true;

    // Grab a batch of jobs.
    const jobs = this.queueService.queues.contacts.jobs.splice(0, 50);
    const pubkeys = jobs.map((j) => j.identifier);

    // Use a dynamic timeout depending on the number of pubkeys requested.
    // const timeout = pubkeys.length * 1000;
    const timeout = pubkeys.length < 10 ? 10000 : 20000;

    // Download the profiles that was queued up.
    this.downloadNewestContactsEvents(pubkeys, timeout)
      .pipe(
        finalize(() => {
          this.queueService.queues.contacts.active = false;
        })
      )
      .subscribe(async (event) => {
        if (!event) {
          return;
        }

        // Whenever we download the contacts document, we'll refresh the RELAYS and FOLLOWING
        // on the profile in question.
        const following = event.tags.map((t) => t[1]);

        // Make sure we run update and not put whenever we download the latest profile.
        this.profileService.followingAndRelays(event.pubkey, following, event.content);

        for (let i = 0; i < jobs.length; i++) {
          if (jobs[i].callback) {
            jobs[i].callback(event);
          }
        }
      });
  }

  processProfilesQueue() {
    // console.log('processProfilesQueue', this.isFetching);

    // If currently fetching, just skip until next interval.
    if (this.isFetching) {
      return;
    }

    // Grab all queued up profiles and ask for them, or should we have a maximum item?
    // For now, let us grab 10 and process those until next interval.

    console.log('BEFORE:', JSON.stringify(this.profileQueue));
    const pubkeys = this.profileQueue.splice(0, this.profileBatchSize);
    console.log('AFTER:', JSON.stringify(this.profileQueue));

    for (let i = 0; i < this.relayService.relays.length; i++) {
      this.fetchProfiles(this.relayService.relays[i], pubkeys);
    }
  }

  /** Creates an observable that will attempt to get newest profile entry across all relays and perform multiple callbacks if newer is found. */
  downloadNewestProfiles(pubkeys: string[], requestTimeout = 10000, expectedCount = -1) {
    return this.downloadNewestProfileEvents(pubkeys, requestTimeout, expectedCount).pipe(
      map((event: any) => {
        if (!event) {
          return;
        }

        const profile = this.utilities.mapProfileEvent(event);
        return profile;
      })
    );
  }

  /** Creates an observable that will attempt to get newest profile events across all relays and perform multiple callbacks if newer is found. */
  downloadNewestProfileEvents(pubkeys: string[], requestTimeout = 10000, expectedCount = -1) {
    return this.downloadNewestEvents(pubkeys, [0], requestTimeout, expectedCount);
  }

  downloadNewestContactsEvents(pubkeys: string[], requestTimeout = 10000, expectedEventCount = -1) {
    return this.downloadNewestEvents(pubkeys, [3], requestTimeout, expectedEventCount);
  }

  downloadNewestEvents(pubkeys: string[], kinds: number[], requestTimeout = 10000, expectedEventCount = -1) {
    return this.downloadNewestEventsByQuery([{ kinds: kinds, authors: pubkeys }], requestTimeout, expectedEventCount);
  }

  downloadEventsByTags(query: any[], requestTimeout = 10000) {
    return this.downloadEventsByQuery(query);
  }

  /** Download a single event from all relays. */
  downloadEvent(id: string, requestTimeout = 5000) {
    return this.downloadEventByQuery([{ ids: [id] }], requestTimeout);
  }

  downloadEventByQuery(query: any, requestTimeout = 10000) {
    let event: any;

    return this.connected$
      .pipe(mergeMap(() => this.relayService.connectedRelays())) // TODO: Time this, it appears to take a lot of time??
      .pipe(mergeMap((relay) => this.downloadFromRelay(query, relay)))
      .pipe(
        filter((data) => {
          // Only trigger the reply once.
          if (!event) {
            event = data;
            return true;
          } else {
            return false;
          }
        })
      );
    // .pipe(
    //   timeout(requestTimeout),
    //   catchError((error) => of(`The query timed out before it could complete: ${JSON.stringify(query)}.`))
    // );
  }

  /** Creates an observable that will attempt to get newest events across all relays and perform multiple callbacks if newer is found. */
  downloadNewestEventsByQuery(query: any, requestTimeout = 10000, expectedEventCount = -1) {
    // TODO: Tune the timeout. There is no point waiting for too long if the relay is overwhelmed with requests as we will simply build up massive backpressure in the client.
    const totalEvents: NostrEventDocument[] = [];
    // TODO: Figure out if we end up having memory leak with this totalEvents array.
    const observables = this.relayService.connectedRelays().map((relay) => this.downloadFromRelay(query, relay));

    return merge(...observables)
      .pipe(
        filter((data, index) => {
          let result = false;

          // This logic is to ensure we don't care about receiving the same data more than once, unless the data is newer.
          const existingEventIndex = totalEvents.findIndex((e) => e.id === data.id);
          if (existingEventIndex > -1) {
            const existingEvent = totalEvents[existingEventIndex];

            // Verify if newer, then replace
            if (existingEvent.created_at < data.created_at) {
              totalEvents[existingEventIndex] = data;
              result = true;
            }
          } else {
            totalEvents.push(data);
            result = true;
          }

          if (expectedEventCount > -1 && expectedEventCount != 0) {
            expectedEventCount--;
          }

          return result;
        })
      )
      .pipe(
        timeout(requestTimeout),
        catchError((error) => {
          console.warn('The observable was timed out.');
          return of(undefined);
        }) // Simply return undefined when the timeout is reached.
      );
  }

  downloadEventsByQuery(query: any[], requestTimeout = 10000) {
    return this.connected$
      .pipe(mergeMap(() => this.relayService.connectedRelays())) // TODO: Time this, it appears to take a lot of time??
      .pipe(mergeMap((relay) => this.downloadFromRelay(query, relay)));
  }

  subscribeLatestEvents(kinds: number[], pubkeys: string[], limit: number) {
    // Make individual filters on the subscription so we will get limit for each individual pubkey.
    let filters: Filter[] = pubkeys.map((a) => {
      return { kinds: kinds, limit: limit, authors: [a] };
    });

    if (filters.length === 0) {
      filters = [{ kinds: kinds, limit: limit }];
    }

    return this.connected$.pipe(mergeMap(() => this.relayService.connectedRelays())).pipe(mergeMap((relay) => this.subscribeToRelay(filters, relay)));
  }

  subscribeToRelay(filters: Filter[], relay: NostrRelay): Observable<NostrEventDocument> {
    return new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
      const sub = relay.sub(filters, {}) as NostrSubscription;
      relay.subscriptions.push(sub);

      sub.on('event', (originalEvent: any) => {
        const event = this.eventService.processEvent(originalEvent);

        if (!event) {
          return;
        }

        observer.next(event);
      });

      sub.on('eose', () => {});

      return () => {
        console.log('subscribeToRelay:finished:unsub');
        // When the observable is finished, this return function is called.
        sub.unsub();
        const subIndex = relay.subscriptions.findIndex((s) => s == sub);
        if (subIndex > -1) {
          relay.subscriptions.splice(subIndex, 1);
        }
      };
    });
  }

  downloadFromRelay(filters: Filter[], relay: NostrRelay): Observable<NostrEventDocument> {
    return new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
      const sub = relay.sub([...filters], {}) as NostrSubscription;
      relay.subscriptions.push(sub);

      sub.on('event', (originalEvent: any) => {
        const event = this.eventService.processEvent(originalEvent);

        if (!event) {
          return;
        }

        observer.next(event);
      });

      sub.on('eose', () => {
        observer.complete();
      });

      return () => {
        // console.log('downloadFromRelay:finished:unsub');
        // When the observable is finished, this return function is called.
        sub.unsub();
      };
    });
  }

  // downloadFromRelay2(query: any, relay: NostrRelay): Observable<NostrEventDocument[]> {
  //   return new Observable<NostrEventDocument[]>((observer: Observer<NostrEventDocument[]>) => {
  //     const totalEvents: NostrEventDocument[] = [];

  //     const sub = relay.sub([query], {}) as NostrSubscription;

  //     sub.on('event', (originalEvent: any) => {
  //       // console.log('downloadFromRelayIndex: event', id);
  //       const event = this.eventService.processEvent(originalEvent);
  //       // console.log('downloadFromRelayIndex: event', event);

  //       if (!event) {
  //         return;
  //       }

  //       totalEvents.unshift(event);
  //       observer.next(totalEvents);
  //       // sub.unsub();
  //     });

  //     sub.on('eose', () => {
  //       // console.log('downloadFromRelayIndex: eose', id);
  //       observer.complete();
  //       sub.unsub();
  //     });
  //   });
  // }

  // downloadProfile(pubkey: string) {
  //   if (!pubkey) {
  //     return;
  //   }

  //   console.log('profileQueue.length1:', JSON.stringify(this.profileQueue));

  //   // Skip if array already includes this pubkey.
  //   if (this.profileQueue.includes(pubkey)) {
  //     return;
  //   }

  //   console.log(this);
  //   console.log('ADD DOWNLOAD PROFILE:', pubkey);
  //   this.profileQueue.push(pubkey);

  //   console.log('profileQueue.length2:', JSON.stringify(this.profileQueue));

  //   this.processProfilesQueue();

  //   // Wait some CPU cycles for potentially more profiles before we process.
  //   // setTimeout(() => {
  //   //   console.log('processProfilesQueue!!!', this.profileQueue.length);
  //   //   this.processProfilesQueue();
  //   // }, 1000);

  //   // TODO: Loop all relays until we find the profile.
  //   // return this.fetchProfiles(this.relays[0], [pubkey]);
  // }

  fetchProfiles(relay: Relay, authors: string[]) {
    if (!authors || authors.length === 0) {
      return;
    }

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
      const prossedEvent = this.eventService.processEvent(originalEvent);

      if (!prossedEvent) {
        return;
      }

      try {
        const jsonParsed = JSON.parse(prossedEvent.content) as NostrProfileDocument;
        const profile = this.validator.sanitizeProfile(jsonParsed) as NostrProfileDocument;

        // Keep a copy of the created_at value.
        profile.created_at = prossedEvent.created_at;

        // Persist the profile.
        // await this.profileService.updateProfile(prossedEvent.pubkey, profile);

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
        console.warn('This profile event was not parsed due to errors:', prossedEvent);
      }
    });

    profileSub.on('eose', () => {
      profileSub.unsub();
      this.isFetching = false;
    });
  }

  async cleanProfiles() {
    // const profileTable = this.storage.table<NostrProfileDocument>('profile');
    // const iterator = profileTable.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    // const now = moment();
    // for await (const [key, value] of iterator) {
    //   // Skip all profiles that the user is following, blocked or muted.
    //   if (value.follow || value.block || value.mute) {
    //     continue;
    //   }
    //   const lastChanged = value.modified || value.created;
    //   const date = moment.unix(lastChanged).add(-2, 'days');
    //   var days = now.diff(date, 'days');
    //   if (days > this.daysToKeepProfiles) {
    //     console.log('Profile removed from cache: ', value);
    //     await profileTable.del(key);
    //   }
    // }
    // setTimeout(async () => {
    //   await this.cleanProfiles();
    // }, this.cleanProfileInterval);
  }

  /** Creates an event ready for modification, signing and publish. */
  createEvent(kind: Kind | number, content: any): Event {
    let event: Event = {
      kind: kind,
      created_at: Math.floor(Date.now() / 1000),
      content: content,
      pubkey: this.appState.getPublicKey(),
      tags: [],
    };

    return event;
  }

  /** Request an event to be signed. This method will calculate the content id automatically. */
  async signEvent(event: Event) {
    if (!event.id) {
      event.id = getEventHash(event);
    }

    const gt = globalThis as any;

    // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
    const signedEvent = await gt.nostr.signEvent(event);

    // We force validation upon user so we make sure they don't create content that we won't be able to parse back later.
    // We must do this before we run nostr-tools validate and signature validation.
    const verifiedEvent = this.eventService.processEvent(signedEvent as NostrEventDocument);

    let ok = validateEvent(signedEvent);

    if (!ok) {
      throw new Error('The event is not valid. Cannot publish.');
    }

    let veryOk = await verifySignature(signedEvent as any); // Required .id and .sig, which we know has been added at this stage.

    if (!veryOk) {
      throw new Error('The event signature not valid. Maybe you choose a different account than the one specified?');
    }

    return signedEvent;
  }

  /** Will attempt to publish to all registered events independent of their current connection status. This will fail
   * to publish if the relay is not currently connected. Failed publish will not be retried.
   */
  async publishEvent(event: Event) {
    for (let i = 0; i < this.relayService.relays.length; i++) {
      const relay = this.relayService.relays[i];

      let pub = relay.publish(event);
      pub.on('ok', () => {
        console.log(`${relay.url} has accepted our event`);
      });
      pub.on('seen', () => {
        console.log(`we saw the event on ${relay.url}`);
      });
      pub.on('failed', (reason: any) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`);
      });
    }
  }

  async publishContacts(pubkeys: string[]) {
    const mappedContacts = pubkeys.map((c) => {
      return ['p', c];
    });

    let originalEvent: Event = {
      kind: 3,
      created_at: Math.floor(Date.now() / 1000),
      content: '',
      pubkey: this.appState.getPublicKey(),
      tags: mappedContacts,
    };

    originalEvent.id = getEventHash(originalEvent);

    const gt = globalThis as any;

    // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
    const signedEvent = await gt.nostr.signEvent(originalEvent);
    originalEvent = signedEvent;

    // We force validation upon user so we make sure they don't create content that we won't be able to parse back later.
    // We must do this before we run nostr-tools validate and signature validation.
    const event = this.eventService.processEvent(originalEvent as NostrEventDocument);

    let ok = validateEvent(originalEvent);

    if (!ok) {
      throw new Error('The event is not valid. Cannot publish.');
    }

    let veryOk = await verifySignature(originalEvent as any); // Required .id and .sig, which we know has been added at this stage.

    if (!veryOk) {
      throw new Error('The event signature not valid. Maybe you choose a different account than the one specified?');
    }

    if (!event) {
      return;
    }

    console.log('PUBLISH EVENT:', originalEvent);

    // First we persist our own event like would normally happen if we receive this event.
    // await this.#persist(event);

    for (let i = 0; i < this.relayService.relays.length; i++) {
      const relay = this.relayService.relays[i];

      let pub = relay.publish(event);
      pub.on('ok', () => {
        console.log(`${relay.url} has accepted our event`);
      });
      pub.on('seen', () => {
        console.log(`we saw the event on ${relay.url}`);
      });
      pub.on('failed', (reason: any) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`);
      });
    }
  }
}
