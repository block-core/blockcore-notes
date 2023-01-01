import { Injectable } from '@angular/core';
import { NostrEvent, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import * as moment from 'moment';
import { FeedService } from './feed.service';
import { EventService } from './event.service';
import { RelayService } from './relay.service';
import { Relay } from 'nostr-tools';
import { DataValidation } from './data-validation.service';
import { ApplicationState } from './applicationstate.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  daysToKeepProfiles = 14;
  cleanProfileInterval = 1000 * 60 * 60; // Every hour
  //downloadProfileInterval = 1000 * 3; // Every 3 seconds
  downloadProfileInterval = 500;
  profileBatchSize = 20;
  refreshUserProfile = 1000 * 60 * 60 * 2; // Every second hour

  constructor(
    private appState: ApplicationState,
    private storage: StorageService,
    private profileService: ProfileService,
    private feedService: FeedService,
    private validator: DataValidation,
    private eventService: EventService,
    private relayService: RelayService
  ) {
    // Whenever the profile service needs to get a profile from the network, this event is triggered.
    this.profileService.profileRequested$.subscribe(async (pubkey) => {
      if (!pubkey) {
        return;
      }

      await this.downloadProfile(pubkey);
    });
  }

  async initialize() {
    setTimeout(async () => {
      await this.cleanProfiles();
    }, this.cleanProfileInterval);

    setTimeout(async () => {
      await this.downloadProfiles();
    }, this.downloadProfileInterval);

    // On set interval, add the user's own profile to download.
    // setTimeout(async () => {
    //   this.profileQueue.push(this.appState.getPublicKey());
    // }, this.refreshUserProfile);

    // If at startup we don't have the logged on user profile, queue it up for retreival.
    // When requesting the profile, it will be auto-requested from relays.
    setTimeout(async () => {
      await this.profileService.getProfile(this.appState.getPublicKey());
    }, 2000);
  }

  async downloadProfiles() {
    this.processProfilesQueue();

    setTimeout(async () => {
      await this.downloadProfiles();
    }, this.downloadProfileInterval);
  }

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
    const pubkeys = this.profileQueue.splice(0, this.profileBatchSize);
    this.fetchProfiles(this.relayService.relays[0], pubkeys);
  }

  downloadProfile(pubkey: string) {
    if (!pubkey) {
      debugger;
      return;
    }

    if (!this.profileQueue.find((p) => p === pubkey)) {
      console.log('ADD DOWNLOAD PROFILE:', pubkey);
      this.profileQueue.push(pubkey);
    }

    // Wait some CPU cycles for potentially more profiles before we process.
    setTimeout(() => {
      this.processProfilesQueue();
    }, 250);

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

        // Persist the profile.
        await this.profileService.updateProfile(prossedEvent.pubkey, profile);

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
    const profileTable = this.storage.table<NostrProfileDocument>('profile');
    const iterator = profileTable.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    const now = moment();

    for await (const [key, value] of iterator) {
      // Skip all profiles that the user is following, blocked or muted.
      if (value.follow || value.block || value.mute) {
        continue;
      }

      const lastChanged = value.modified || value.created;
      const date = moment.unix(lastChanged).add(-2, 'days');
      var days = now.diff(date, 'days');

      if (days > this.daysToKeepProfiles) {
        console.log('Profile removed from cache: ', value);
        await profileTable.del(key);
      }
    }

    setTimeout(async () => {
      await this.cleanProfiles();
    }, this.cleanProfileInterval);
  }
}
