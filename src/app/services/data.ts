import { Injectable } from '@angular/core';
import { NostrEvent, NostrEventDocument, NostrProfileDocument, NostrRelay, NostrSubscription, QueryJob } from './interfaces';
import { ProfileService } from './profile';
import { EventService } from './event';
import { RelayService } from './relay';
import { Filter, Relay, Event, getEventHash, validateEvent, verifySignature, Kind, UnsignedEvent } from 'nostr-tools';
import { DataValidation } from './data-validation';
import { ApplicationState } from './applicationstate';
import { timeout, map, merge, Observable, delay, Observer, race, take, switchMap, mergeMap, tap, finalize, concatMap, mergeAll, exhaustMap, catchError, of, combineAll, combineLatestAll, filter, from } from 'rxjs';
import { Utilities } from './utilities';
import { StorageService } from './storage';
import { QueueService } from './queue.service';
import { UIService } from './ui';
import { CircleService } from './circle';
import { NostrService } from './nostr';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  daysToKeepProfiles = 14;
  cleanProfileInterval = 1000 * 60 * 60; // Every hour
  profileBatchSize = 20;
  refreshUserProfile = 1000 * 60 * 60 * 2; // Every second hour
  connected = false;

  // Observable that can be merged with to avoid performing calls unless we have connected to relays.
  connected$ = this.appState.connected$.pipe(map((status) => status === true));

  constructor(
    private nostr: NostrService,
    private ui: UIService,
    private circleService: CircleService,
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
        this.initialDataLoad();

        // console.log('Connection established, start processing queues.');
        // this.processQueues();
      }
    });

    // Schedule a timeout whenever the queues has been triggered, to wait for additional items that might arrive in a loop.
    // this.queueService.queues$.subscribe(() => {
    //   setTimeout(() => {
    //     this.processQueues();
    //   }, 250);
    // });
  }

  async publishRelays() {
    const mappedRelays = this.getArrayFomattedRelayList();

    let originalEvent: UnsignedEvent = {
      kind: 10002, // NIP-65: https://github.com/nostr-protocol/nips/blob/master/65.md
      created_at: Math.floor(Date.now() / 1000),
      content: '',
      pubkey: this.appState.getPublicKey(),
      tags: mappedRelays,
    };

    const event = await this.createAndSignEvent(originalEvent);

    if (!event) {
      return;
    }

    console.log('PUBLISH EVENT:', event);
    this.relayService.publish(event);
  }

  private getArrayFomattedRelayList() {
    return this.relayService.items
      .filter((r) => r.public === true)
      .map((r) => {
        let relayEntry = ['r', r.url];

        if (r.type == 2) {
          relayEntry.push('read');
        } else if (r.type == 3) {
          relayEntry.push('write');
        }

        return relayEntry;
      });
  }

  private getJsonFormattedRelayList() {
    let mappedRelays: any = {};

    this.relayService.items
      .filter((r) => r.public)
      .map((r) => {
        mappedRelays[r.url] = {
          read: r.type === 1 || r.type === 2,
          write: r.type === 1 || r.type === 3,
        };
      });

    return mappedRelays;
  }

  private async createAndSignEvent(originalEvent: UnsignedEvent) {
    let signedEvent = originalEvent as Event;

    signedEvent.id = getEventHash(originalEvent);

    // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
    signedEvent = await this.nostr.sign(originalEvent);

    // We force validation upon user so we make sure they don't create content that we won't be able to parse back later.
    // We must do this before we run nostr-tools validate and signature validation.
    const event = this.eventService.processEvent(signedEvent as NostrEventDocument);

    if (!event) {
      throw new Error('The event is not valid. Cannot publish.');
    }

    let ok = validateEvent(signedEvent);

    if (!ok) {
      throw new Error('The event is not valid. Cannot publish.');
    }

    let veryOk = await verifySignature(event as any); // Required .id and .sig, which we know has been added at this stage.

    if (!veryOk) {
      throw new Error('The event signature not valid. Maybe you choose a different account than the one specified?');
    }

    return event;
  }

  /** Get's all following and all public relays. */
  async getContactsAndRelays() {
    const contacts = await this.storage.storage.getContacts(this.appState.getPublicKey());
    return contacts;

    // const nonPublicCircles = this.circleService.circles.filter((c) => !c.public).map((c) => c.id);
    // const publicFollowing = this.profileService.following.filter((p) => nonPublicCircles.indexOf(p.circle) == -1).map((p) => p.pubkey);
    // const mappedContacts = publicFollowing.map((c) => {
    //   return ['p', c];
    // });

    // const mappedRelays = this.getJsonFormattedRelayList();

    // let originalEvent: Event = {
    //   kind: Kind.Contacts,
    //   created_at: Math.floor(Date.now() / 1000),
    //   content: JSON.stringify(mappedRelays),
    //   pubkey: this.appState.getPublicKey(),
    //   tags: mappedContacts,
    // };

    // const event = await this.createAndSignEvent(originalEvent);

    // if (!event) {
    //   return;
    // }

    // console.log('PUBLISH EVENT:', event);
    // this.relayService.publish(event);
  }

  /** Get's all following and all public relays. */
  async publishContactsAndRelays() {
    const nonPublicCircles = this.circleService.circles.filter((c) => !c.public).map((c) => c.id);
    const publicFollowing = this.profileService.following.filter((p) => nonPublicCircles.indexOf(p.circle) == -1).map((p) => p.pubkey);
    const mappedContacts = publicFollowing.map((c) => {
      return ['p', c];
    });

    const mappedRelays = this.getJsonFormattedRelayList();

    let originalEvent: UnsignedEvent = {
      kind: Kind.Contacts,
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify(mappedRelays),
      pubkey: this.appState.getPublicKey(),
      tags: mappedContacts,
    };

    const event = await this.createAndSignEvent(originalEvent);

    if (!event) {
      return;
    }

    console.log('PUBLISH EVENT:', event);
    this.relayService.publish(event);
  }

  async initialDataLoad() {
    // Listen to profile and contacts of the logged on user.
    this.relayService.subscribe([{ authors: [this.appState.getPublicKey()], kinds: [Kind.Metadata, Kind.Contacts] }], 'self');

    // Download the profile of the user.
    // this.enque({
    //   identifier: this.appState.getPublicKey(),
    //   type: 'Profile',
    // });

    // // Download the following of the user.
    // this.enque({
    //   identifier: this.appState.getPublicKey(),
    //   type: 'Contacts',
    // });

    // Create the listeners (filters) for relays:
    // TODO: There is limit on maximum following, we need a strategy to handle that.
    // potentially subscribing and unsubscribing on intervals with a .since field between each interval.
    const pubKeys = this.profileService.following.map((p) => p.pubkey);

    // Add self to the top of listening list:
    pubKeys.unshift(this.appState.getPublicKey());

    // console.log('PUB KEYS:', pubKeys);
    // const filter = [{ authors: pubKeys, since: this.storage.state.since, kinds: [Kind.Text, Kind.Reaction, 6] }];
    // Subscribe to new events but don't get any history (limit: 0).
    // console.log('queueSubscription:', filter);

    // this.relayService.queueSubscription([{ authors: pubKeys, since: this.storage.state.since }]);
    // this.relayService.subscribe(filter);

    // Notifications is a hard-coded subscription identifier.
    // Previously there was no filter on kind, then "started following you" events was shown due to kind 3, but downloading kind 3 for everyone is
    // fairly heavy operation so disabled for now.
    this.relayService.subscribe([{ ['#p']: [this.appState.getPublicKey()], limit: 100, kinds: [Kind.Text, Kind.Reaction, 6] }], 'notifications');

    // Load the 10 latest notifications to be displayed on home page.
    const notifications = await this.storage.storage.getNotifications(10);
    this.ui.putNotifications(notifications);
  }

  async initialize() {
    setTimeout(async () => {
      await this.cleanProfiles();
    }, this.cleanProfileInterval);
  }

  isFetching = false;
  profileQueue: string[] = [];
  queue: QueryJob[] = [];

  /** Enques a job to be processed against connected relays. */
  enque(job: QueryJob) {
    // It is way more optimal to just delegate jobs into separate queues when enquing than querying later.
    // if (job.type == 'Profile') {
    //   this.queueService.queues.profile.jobs.push(job);
    // } else if (job.type == 'Contacts') {
    //   this.queueService.queues.contacts.jobs.push(job);
    // } else if (job.type == 'Event') {
    //   this.queueService.queues.event.jobs.push(job);
    // } else {
    //   throw Error(`This type of job (${job.type}) is currently not supported.`);
    // }

    // Enque the job on all web workers.
    this.relayService.action('enque', job);

    // We always delay the processing in case we receive
    // setTimeout(() => {
    //   this.processQueues();
    // }, 100);
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
    // if (!this.connected) {
    //   console.warn('Cannot process queues, no connection to relays.');
    //   return;
    // }
    // // Processing queues basically just copies the jobs from data service to the individual web workers.
    // if (this.queueService.queues.profile.jobs.length > 0) {
    //   this.processProfileQueue();
    // }
    // if (this.queueService.queues.contacts.jobs.length > 0) {
    //   this.processContactsQueue();
    // }
    // if (this.queueService.queues.event.jobs.length > 0) {
    //   this.processEventQueue();
    // }
  }

  processEventQueue() {
    // if (this.queueService.queues.event.active) {
    //   console.log('Events are already active... Skipping.');
    //   return;
    // }
    // const jobs = this.queueService.queues.event.jobs.splice(0, 10);
    // const filters = jobs.map((j) => {
    //   return {
    //     kinds: [1],
    //     authors: [j.identifier],
    //     // limit: j.limit,
    //   } as Filter;
    // });
    // return this.downloadNewestEventsByQuery(filters).subscribe(async (event) => {
    //   if (!event) {
    //     return;
    //   }
    //   // If we are following this user, we'll persist this event.
    //   const following = this.profileService.isFollowing(event.pubkey);
    //   if (following) {
    //     await this.storage.storage.putEvents(event);
    //   }
    //   // for (let i = 0; i < jobs.length; i++) {
    //   //   if (jobs[i].callback) {
    //   //     jobs[i].callback(event);
    //   //   }
    //   // }
    // });
  }

  processProfileQueue() {
    // console.log('processProfileQueue');
    // // If already active, just skip processing for now.
    // if (this.queueService.queues.profile.active) {
    //   console.log('processProfileQueue: skip');
    //   return;
    // }
    // // Grab a batch of jobs.
    // const jobs = this.queueService.queues.profile.jobs.splice(0, 50);
    // const pubkeys = jobs.map((j) => j.identifier);
    // console.log('processProfileQueue: pubkeys', pubkeys);
    // // Download the profiles that was queued up.
    // this.downloadNewestProfiles(pubkeys, 10000, pubkeys.length).subscribe(async (event) => {
    //   // const e = await event;
    //   console.log('processProfileQueue: event', event);
    //   if (!event) {
    //     return;
    //   }
    //   // Make sure we run update and not put whenever we download the latest profile.
    //   await this.profileService.updateProfile(event.pubkey, event);
    //   // for (let i = 0; i < jobs.length; i++) {
    //   //   if (jobs[i].callback) {
    //   //     jobs[i].callback(event);
    //   //   }
    //   // }
    // });
  }

  processContactsQueue() {
    // console.log('processContactsQueue');
    // // If already active, just skip processing for now.
    // if (this.queueService.queues.contacts.active) {
    //   console.log('processContactsQueue: skip');
    //   return;
    // }
    // this.queueService.queues.contacts.active = true;
    // // Grab a batch of jobs.
    // const jobs = this.queueService.queues.contacts.jobs.splice(0, 50);
    // const pubkeys = jobs.map((j) => j.identifier);
    // // Use a dynamic timeout depending on the number of pubkeys requested.
    // // const timeout = pubkeys.length * 1000;
    // const timeout = pubkeys.length < 10 ? 10000 : 20000;
    // // Download the profiles that was queued up.
    // this.downloadNewestContactsEvents(pubkeys, timeout)
    //   .pipe(
    //     finalize(() => {
    //       this.queueService.queues.contacts.active = false;
    //     })
    //   )
    //   .subscribe(async (event) => {
    //     if (!event) {
    //       return;
    //     }
    //     // Whenever we download the contacts document, we'll refresh the RELAYS and FOLLOWING
    //     // on the profile in question.
    //     const following = event.tags.map((t) => t[1]);
    //     // Make sure we run update and not put whenever we download the latest profile.
    //     this.profileService.followingAndRelays(event.pubkey, following, event.content);
    //     // for (let i = 0; i < jobs.length; i++) {
    //     //   if (jobs[i].callback) {
    //     //     jobs[i].callback(event);
    //     //   }
    //     // }
    //   });
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
    return this.downloadNewestProfileEventByQuery([{ kinds: [0], authors: pubkeys }], requestTimeout, expectedCount);
  }

  // downloadNewestContactsEvents(pubkeys: string[], requestTimeout = 10000, expectedEventCount = -1) {
  //   return this.downloadNewestEvents(pubkeys, [3], requestTimeout, expectedEventCount);
  // }

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
      .pipe(mergeMap((relay) => this.downloadFromRelay(query, relay, requestTimeout)))
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
      )
      .pipe(
        timeout(requestTimeout),
        catchError((error) => {
          console.warn('The observable was timed out.');
          return of(undefined);
        }) // Simply return undefined when the timeout is reached.
      );
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

          // This logic is to ensure we don't care about receiving the same data more than once.
          const existingEventIndex = totalEvents.findIndex((e) => e.id === data.id);
          if (existingEventIndex > -1) {
            result = false;
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

  /** Creates an observable that will attempt to get newest events across all relays and perform multiple callbacks if newer is found. */
  downloadNewestProfileEventByQuery(query: any, requestTimeout = 10000, expectedEventCount = -1) {
    // TODO: Tune the timeout. There is no point waiting for too long if the relay is overwhelmed with requests as we will simply build up massive backpressure in the client.
    // const totalEvents: NostrEventDocument[] = [];
    // TODO: Figure out if we end up having memory leak with this totalEvents array.
    const observables = this.relayService.connectedRelays().map((relay) => this.downloadFromRelay(query, relay));

    return merge(...observables).pipe(
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

  // subscribeLatestEvents(kinds: number[], pubkeys: string[], limit: number) {
  //   // Make individual filters on the subscription so we will get limit for each individual pubkey.
  //   let filters: Filter[] = pubkeys.map((a) => {
  //     return { kinds: kinds, limit: limit, authors: [a] };
  //   });

  //   if (filters.length === 0) {
  //     filters = [{ kinds: kinds, limit: limit }];
  //   }

  //   return this.connected$.pipe(mergeMap(() => this.relayService.connectedRelays())).pipe(mergeMap((relay) => this.subscribeToRelay(filters, relay)));
  // }

  // subscribeToRelay(filters: Filter[], relay: NostrRelay): Observable<NostrEventDocument> {
  //   return new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
  //     const sub = relay.sub(filters, {}) as NostrSubscription;
  //     // relay.subscriptions.push(sub);

  //     sub.on('event', (originalEvent: any) => {
  //       const event = this.eventService.processEvent(originalEvent);

  //       if (!event) {
  //         return;
  //       }

  //       observer.next(event);
  //     });

  //     sub.on('eose', () => {});

  //     return () => {
  //       console.log('subscribeToRelay:finished:unsub');
  //       // When the observable is finished, this return function is called.
  //       sub.unsub();
  //       // const subIndex = relay.subscriptions.findIndex((s) => s == sub);
  //       // if (subIndex > -1) {
  //       //   relay.subscriptions.splice(subIndex, 1);
  //       // }
  //     };
  //   });
  // }

  async updateMetadata(profile: NostrProfileDocument) {
    const profileContent = this.utilities.reduceProfile(profile!);

    let event = this.createEvent(Kind.Metadata, JSON.stringify(profileContent));

    const signedEvent = await this.signEvent(event);

    // await this.feedService.publish(event, false); // Don't persist this locally.
    profile!.created_at = event.created_at;

    // Use the whole document for this update as we don't want to loose additional metadata we have, such
    // as follow (on self).
    await this.profileService.updateProfile(profile!.pubkey, profile!);

    await this.publishEvent(signedEvent);
  }

  downloadFromRelay(filters: Filter[], relay: NostrRelay, requestTimeout = 10000): Observable<NostrEventDocument> {
    return new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
      const sub = relay.sub([...filters], {}) as NostrSubscription;
      // relay.subscriptions.push(sub);

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
    }).pipe(
      timeout(requestTimeout),
      catchError((error) => {
        console.warn('The observable was timed out.');
        return of();
      }) // Simply return undefined when the timeout is reached.
    );
  }

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

    profileSub.on('event', async (event: Event) => {
      const originalEvent = event as NostrEvent;
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
  createEvent(kind: Kind | number, content: any): UnsignedEvent {
    return this.createEventWithPubkey(kind, content, this.appState.getPublicKey());
  }

  createEventWithPubkey(kind: Kind | number, content: any, pubkey: string): UnsignedEvent {
    let event: UnsignedEvent = {
      kind: kind,
      created_at: Math.floor(Date.now() / 1000),
      content: content,
      pubkey: pubkey,
      tags: [],
    };

    return event;
  }

  /** Request an article to be signed. This method does not add id. */
  async signArticle(event: UnsignedEvent) {
    let signedEvent = event as Event;

    // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
    signedEvent = await this.nostr.sign(event);

    // We force validation upon user so we make sure they don't create content that we won't be able to parse back later.
    // We must do this before we run nostr-tools validate and signature validation.
    const verifiedEvent = this.eventService.processEvent(signedEvent as NostrEventDocument);

    if (!verifiedEvent) {
      throw new Error('The event is not valid. Cannot publish.');
    }

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

  /** Request an badge definition to be signed. This method does not add id. */
  async signBadgeDefinition(event: UnsignedEvent) {
    return this.signArticle(event);
  }

  /** Request an event to be signed. This method will calculate the content id automatically. */
  async signEvent(event: UnsignedEvent) {
    let signedEvent = event as Event;

    if (!signedEvent.id) {
      signedEvent.id = getEventHash(event);
    }

    return this.signArticle(signedEvent);

    // // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
    // signedEvent = await this.nostr.sign(event);

    // // We force validation upon user so we make sure they don't create content that we won't be able to parse back later.
    // // We must do this before we run nostr-tools validate and signature validation.
    // const verifiedEvent = this.eventService.processEvent(signedEvent as NostrEventDocument);

    // let ok = validateEvent(signedEvent);

    // if (!ok) {
    //   throw new Error('The event is not valid. Cannot publish.');
    // }

    // let veryOk = await verifySignature(signedEvent as any); // Required .id and .sig, which we know has been added at this stage.

    // if (!veryOk) {
    //   throw new Error('The event signature not valid. Maybe you choose a different account than the one specified?');
    // }

    // return signedEvent;
  }

  async publishEvent(event: Event) {
    this.relayService.publish(event);
  }

  async publishContacts(pubkeys: string[]) {
    const mappedContacts = pubkeys.map((c) => {
      return ['p', c];
    });

    let originalEvent: UnsignedEvent = {
      kind: 3,
      created_at: Math.floor(Date.now() / 1000),
      content: '',
      pubkey: this.appState.getPublicKey(),
      tags: mappedContacts,
    };

    let signedEvent = originalEvent as Event;
    signedEvent.id = getEventHash(originalEvent);

    // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
    signedEvent = await this.nostr.sign(originalEvent);

    // We force validation upon user so we make sure they don't create content that we won't be able to parse back later.
    // We must do this before we run nostr-tools validate and signature validation.
    const event = this.eventService.processEvent(signedEvent as NostrEventDocument);

    let ok = validateEvent(signedEvent);

    if (!ok) {
      throw new Error('The event is not valid. Cannot publish.');
    }

    let veryOk = await verifySignature(signedEvent as any); // Required .id and .sig, which we know has been added at this stage.

    if (!veryOk) {
      throw new Error('The event signature not valid. Maybe you choose a different account than the one specified?');
    }

    if (!event) {
      return;
    }

    console.log('PUBLISH EVENT:', signedEvent);

    // First we persist our own event like would normally happen if we receive this event.
    // await this.#persist(event);

    for (let i = 0; i < this.relayService.relays.length; i++) {
      const relay = this.relayService.relays[i];

      let pub = relay.publish(event);
      pub.on('ok', () => {
        console.log(`${relay.url} has accepted our event`);
      });
      // pub.on('seen', () => {
      //   console.log(`we saw the event on ${relay.url}`);
      // });
      pub.on('failed', (reason: any) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`);
      });
    }
  }
}
