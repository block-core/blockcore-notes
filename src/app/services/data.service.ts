import { Injectable } from '@angular/core';
import { NostrEvent, NostrEventDocument, NostrProfileDocument, NostrRelay, NostrSubscription } from './interfaces';
import { ProfileService } from './profile.service';
import * as moment from 'moment';
import { EventService } from './event.service';
import { RelayService } from './relay.service';
import { Filter, Relay } from 'nostr-tools';
import { DataValidation } from './data-validation.service';
import { ApplicationState } from './applicationstate.service';
import { timeout, map, merge, Observable, Observer, race, take, switchMap, mergeMap, tap, finalize, concatMap, mergeAll, exhaustMap, catchError, of, combineAll, combineLatestAll, filter } from 'rxjs';
import { Utilities } from './utilities.service';

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

  constructor(private appState: ApplicationState, private utilities: Utilities, private validator: DataValidation, private eventService: EventService, private relayService: RelayService) {
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

  // Observable that can be merged with to avoid performing calls unless we have connected to relays.
  connected$ = this.appState.connected$.pipe(map((status) => status === true));

  /** Creates an observable that will attempt to get newest profile entry across all relays and perform multiple callbacks if newer is found. */
  downloadNewestProfiles(pubkeys: string[], requestTimeout = 10000) {
    return this.downloadNewestProfileEvents(pubkeys).pipe(
      map(async (event: any) => {
        const profile = this.utilities.mapProfileEvent(event);
        return profile;
      })
    );
  }

  /** Creates an observable that will attempt to get newest profile events across all relays and perform multiple callbacks if newer is found. */
  downloadNewestProfileEvents(pubkeys: string[], requestTimeout = 10000) {
    // TODO: Tune the timeout. There is no point waiting for too long if the relay is overwhelmed with requests as we will simply build up massive backpressure in the client.
    const query = [{ kinds: [0], authors: pubkeys }];
    const totalEvents: NostrEventDocument[] = [];

    return this.connected$
      .pipe(take(1))
      .pipe(mergeMap(() => this.relayService.connectedRelays())) // TODO: Time this, it appears to take a lot of time??
      .pipe(mergeMap((relay) => this.downloadFromRelay(query, relay)))
      .pipe(
        filter((data) => {
          // This logic is to ensure we don't care about receiving the same data more than once, unless the data is newer.
          const existingEventIndex = totalEvents.findIndex((e) => e.id === data.id);
          if (existingEventIndex > -1) {
            const existingEvent = totalEvents[existingEventIndex];

            // Verify if newer, then replace
            if (existingEvent.created_at < data.created_at) {
              totalEvents[existingEventIndex] = data;
              return true;
            }
          } else {
            totalEvents.push(data);
            return true;
          }

          return false;
        })
      )
      .pipe(
        timeout(requestTimeout),
        catchError((error) => of(`The query timed out before it could complete: ${JSON.stringify(query)}.`))
      );
  }

  subscribeLatestEvents(kinds: number[], pubkeys: string[], limit: number) {
    // Make individual filters on the subscription so we will get limit for each individual pubkey.
    let filters: Filter[] = pubkeys.map((a) => {
      return { kinds: kinds, limit: limit, authors: [a] };
    });

    if (filters.length === 0) {
      filters = [{ kinds: kinds, limit: limit }];
    }

    return this.connected$
      .pipe(take(1))
      .pipe(mergeMap(() => this.relayService.connectedRelays()))
      .pipe(mergeMap((relay) => this.subscribeToRelay(filters, relay)));
  }

  downloadFromRelay(filters: Filter[], relay: NostrRelay): Observable<NostrEventDocument> {
    return new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
      const sub = relay.sub([...filters], {}) as NostrSubscription;

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
        console.log('downloadFromRelay:finished:unsub');
        // When the observable is finished, this return function is called.
        sub.unsub();
      };
    });
  }

  subscribeToRelay(filters: Filter[], relay: NostrRelay): Observable<NostrEventDocument> {
    return new Observable<NostrEventDocument>((observer: Observer<NostrEventDocument>) => {
      const sub = relay.sub(filters, {}) as NostrSubscription;

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
      };
    });
  }

  downloadFromRelay2(query: any, relay: NostrRelay): Observable<NostrEventDocument[]> {
    return new Observable<NostrEventDocument[]>((observer: Observer<NostrEventDocument[]>) => {
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
  }

  downloadProfile(pubkey: string) {
    if (!pubkey) {
      return;
    }

    console.log('profileQueue.length1:', JSON.stringify(this.profileQueue));

    // Skip if array already includes this pubkey.
    if (this.profileQueue.includes(pubkey)) {
      return;
    }

    console.log(this);
    console.log('ADD DOWNLOAD PROFILE:', pubkey);
    this.profileQueue.push(pubkey);

    console.log('profileQueue.length2:', JSON.stringify(this.profileQueue));

    this.processProfilesQueue();

    // Wait some CPU cycles for potentially more profiles before we process.
    // setTimeout(() => {
    //   console.log('processProfilesQueue!!!', this.profileQueue.length);
    //   this.processProfilesQueue();
    // }, 1000);

    // TODO: Loop all relays until we find the profile.
    // return this.fetchProfiles(this.relays[0], [pubkey]);
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
}
