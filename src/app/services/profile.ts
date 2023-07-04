import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrProfile, NostrProfileDocument, ProfileStatus } from './interfaces';
import { BehaviorSubject, from, map, Observable, tap, shareReplay } from 'rxjs';
import { ApplicationState } from './applicationstate';
import { Utilities } from './utilities';
import { StorageService } from './storage';
import { CacheService } from './cache';
import { QueueService } from './queue.service';
import { UIService } from './ui';
import { DataService } from './data';
import { Event, Kind } from 'nostr-tools';
import { MetricService } from './metric-service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  initialized = false;

  // TODO: Tune the size of the profile cache, need testing to verify what level of cache makes sense and memory usage of it.
  #cache = new CacheService(500);

  // items$ = dexieToRx(liveQuery(() => this.list(ProfileStatus.Follow)));

  /** Returns a list of profiles based upon status. 0 = public, 1 = follow, 2 = mute, 3 = block */
  // async list(status: ProfileStatus) {
  //   return await this.table.where('status').equals(status).toArray();
  // }

  // async query(equalityCriterias: { [key: string]: any }) {
  //   return await this.table.where(equalityCriterias).toArray();
  // }

  // blockedProfiles$() {
  //   return dexieToRx(liveQuery(() => this.list(ProfileStatus.Block)));
  // }

  // publicProfiles$() {
  //   return dexieToRx(liveQuery(() => this.list(ProfileStatus.Public)));
  // }

  // mutedProfiles$() {
  //   return dexieToRx(liveQuery(() => this.list(ProfileStatus.Mute)));
  // }

  /** The profiles the user is following. */
  following: NostrProfileDocument[] = [];

  followingKeys: string[] = [];

  /** Public key of blocked profiles. */
  blocked: string[] = [];

  /** Public key of muted profiles. */
  muted: string[] = [];

  newProfileEvent?: Event;

  #followingChanged: BehaviorSubject<NostrProfileDocument[]> = new BehaviorSubject<NostrProfileDocument[]>(this.following);

  get following$(): Observable<NostrProfileDocument[]> {
    // value.follow == true
    return this.#profilesChanged.asObservable().pipe(
      map((data) => {
        const filtered = data.filter((events) => events.status == ProfileStatus.Follow);
        return filtered;
      })
    );
  }

  #profileChanged: BehaviorSubject<NostrProfileDocument | undefined> = new BehaviorSubject<NostrProfileDocument | undefined>(undefined);

  /** Profile of the authenticated user. */
  get profile$(): Observable<NostrProfileDocument | undefined> {
    return this.#profileChanged.asObservable();
  }

  profile?: NostrProfileDocument;

  userProfileUpdated(profile: NostrProfileDocument | undefined) {
    this.profile = profile;
    this.#profileChanged.next(profile);
  }

  #profilesChanged: BehaviorSubject<NostrProfileDocument[]> = new BehaviorSubject<NostrProfileDocument[]>(this.following);

  get profiles$(): Observable<NostrProfileDocument[]> {
    return this.#profilesChanged.asObservable();
  }

  #profileRequested: BehaviorSubject<string> = new BehaviorSubject<string>('');

  get profileRequested$(): Observable<string> {
    return this.#profileRequested.asObservable();
  }

  updated() {
    this.#updated();
  }

  #updated() {
    this.#profilesChanged.next(this.following);
    this.#followingChanged.next(this.following);
  }

  /** Called whenever a profile has been updated, but only replace and trigger
   * update even if the newly downloaded profile is the same as the active UI selected item.
   */
  updateItemIfSelected(item?: NostrProfileDocument) {
    if (this.ui.pubkey !== item?.pubkey) {
      return;
    }

    this.ui.setProfile(item);
  }

  getProfilesByStatus(status: ProfileStatus) {
    return this.db.storage.getProfilesByStatus(status);
  }

  async search(searchText: string) {
    // TODO: Implement search on new database logic.
    return;
    // this.table.filter((x) => x.name.toLowerCase().indexOf(searchText) > -1).toArray();
    // return this.table
    //   .filter((profile) => {
    //     if (profile.status == 3) {
    //       // Filter out blocked results.
    //       return false;
    //     }

    //     let index = profile.name?.toLocaleLowerCase().indexOf(searchText);

    //     if (index > -1) {
    //       return true;
    //     }

    //     index = profile.nip05?.toLocaleLowerCase().indexOf(searchText);

    //     if (index > -1) {
    //       return true;
    //     }

    //     index = profile.display_name?.toLocaleLowerCase().indexOf(searchText);

    //     if (index > -1) {
    //       return true;
    //     }

    //     return false;
    //   })
    //   .toArray();
  }

  // mutedProfiles() {
  //   return this.query({ status: ProfileStatus.Mute });
  // }

  // blockedProfiles() {
  //   return this.query({ status: ProfileStatus.Block });
  // }

  // async blockedPublicKeys() {
  //   const profiles = await this.blockedProfiles();
  //   return profiles.map((p) => p.pubkey);
  // }

  // async mutedPublicKeys() {
  //   const profiles = await this.mutedProfiles();
  //   return profiles.map((p) => p.pubkey);
  // }

  // Just a basic observable that triggers whenever any profile has changed.
  #profilesChangedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get profilesChanged$(): Observable<void> {
    return this.#profilesChangedSubject.asObservable();
  }

  #changed() {
    this.#profilesChangedSubject.next(undefined);
  }

  constructor(private db: StorageService, private ui: UIService, private queueService: QueueService, private appState: ApplicationState, private utilities: Utilities, private metricService: MetricService) {
    // this.ui.profile$.subscribe((profile) => {
    // });
    // this.ui.pubkey$.subscribe(async (pubkey) => {
    //   if (!pubkey) {
    //     this.ui.setProfile(undefined);
    //   } else {
    //     const profile = await this.getProfile(pubkey);
    //     if (profile) {
    //       this.ui.setProfile(profile);
    //     }
    //   }
    // });
  }

  getProfileOrDownload(pubkey: string) {
    return (
      new Observable((observer) => {
        this.db.storage
          .getProfile(pubkey)
          .then((profile) => {
            if (profile) {
              observer.next(profile);
              observer.complete();
              return;
            }

            this.queueService.enqueProfile(pubkey);
          })
          .catch((err) => {
            debugger;
            console.warn('FAILED TO GET PROFILE:', err);
          })
          .finally(() => {
            // console.log('FINALLY IN DB GET!');
          });

        return () => {
          // console.log('FINISHED');
        };
      })
        // .pipe(shareReplay()) // TODO: Investigate if this helps us get reply from the same observable if subscribed twice.
        .pipe(
          tap((profile) => {
            // console.log('TAPPING ON PROFILE GET:', profile);
            // this.table.put(profile.pubkey);
          })
        )
    );
  }

  async getLocalProfile(pubkey: string) {
    return this.db.storage.getProfile(pubkey);
  }

  getCachedProfile(pubkey: string) {
    let index = this.following.findIndex((f) => f.pubkey == pubkey);

    if (index > -1) {
      return this.following[index];
    }

    let profileCache = this.#cache.get(pubkey);

    if (profileCache) {
      return profileCache.value;
    }
  }

  async getProfile(pubkey: string) {
    let index = this.following.findIndex((f) => f.pubkey == pubkey);

    if (index > -1) {
      return this.following[index];
    }

    let profileCache = this.#cache.get(pubkey);

    if (profileCache) {
      return profileCache.value;
    }

    let profile = await this.db.storage.getProfile(pubkey);

    if (profile) {
      this.#cache.set(pubkey, profile);
      return profile;
    }

    // TODO: Maybe we should enque if it's been more than a day since we attempted to download
    // this profile?
    this.queueService.enqueProfile(pubkey);
  }

  async putProfile(profile: NostrProfileDocument) {
    if (profile.status == null) {
      profile.status = 0;
    }

    // We should do this only once when first observing the profile, but for data migration we'll do it
    // on every save. This is more optimal than on every rendering.
    profile.npub = this.utilities.getNostrIdentifier(profile.pubkey);

    this.#cache.set(profile.pubkey, profile);

    await this.db.storage.putProfile(profile);

    this.updateItemIfSelected(profile);

    // After updating, we'll update the following list if needed.
    const index = this.following.findIndex((f) => f.pubkey == profile.pubkey);

    if (profile.circle != null) {
      if (profile.status == 1 && index == -1) {
        this.following.push(profile);
        this.#updated();
      } else if (profile.status == 2 && index > -1) {
        this.following.splice(index, 1);
        this.#updated();
      } else {
        this.following[index] = profile;
        this.#updated();
      }
    } else {
      if (index > -1) {
        this.following.splice(index, 1);
        this.#updated();
      }
    }
  }

  async initialize(pubkey: string) {
    // Load the logged on user profile and have it immediately available.
    const profile = await this.getLocalProfile(pubkey);
    this.userProfileUpdated(profile);

    // Perform initial population of .profiles, which contains profile the user is following.
    const items = await this.db.storage.getProfilesByStatus(ProfileStatus.Follow);
    this.following = items;
    this.#profilesChanged.next(this.following);

    const blocked = await this.db.storage.getProfilesByStatus(ProfileStatus.Block);
    const muted = await this.db.storage.getProfilesByStatus(ProfileStatus.Mute);

    this.blocked = blocked.map((p) => p.pubkey);
    this.muted = muted.map((p) => p.pubkey);
    this.followingKeys = this.following.map((p) => p.pubkey);
  }

  async #setStatus(pubkey: string, status: ProfileStatus, circle?: number) {
    let profile = await this.db.storage.getProfile(pubkey);
    const now = Math.floor(Date.now() / 1000);

    if (!profile) {
      throw new Error('The profile does not exists.');
    }

    if (profile.status == ProfileStatus.Block) {
      throw new Error('You have to unblock a user before you can follow again.');
    }

    profile.status = status;
    profile.circle = circle;
    profile.modified = now;

    // Put profile since we already got it in the beginning.
    await this.putProfile(profile);
  }

  #putFollowingProfile(profile: NostrProfileDocument) {
    const existingIndex = this.following.findIndex((p) => p.pubkey == profile.pubkey);

    if (existingIndex === -1) {
      this.following.push(profile);
    } else {
      this.following[existingIndex] = profile;
    }
  }

  /** Follow can be called without having an existing profile persisted. */
  async follow(pubkey?: string, circle: number = 0, existingProfile?: NostrProfileDocument) {
    if (!pubkey) {
      return;
    }

    const profile = await this.getLocalProfile(pubkey);
    const now = this.utilities.now();

    // If there are no local profile, save empty profile and attempt to get.
    if (!profile) {
      if (!existingProfile) {
        existingProfile = this.emptyProfile(pubkey);
      }

      existingProfile.followed = now;
      existingProfile.circle = circle;
      existingProfile.status = ProfileStatus.Follow;
      existingProfile.npub = this.utilities.getNostrIdentifier(existingProfile.pubkey);

      // Save directly, don't put in cache.
      await this.db.storage.putProfile(existingProfile);
      this.#putFollowingProfile(existingProfile);

      // Queue up to get this profile.
      this.queueService.enqueProfile(existingProfile.pubkey);
      return existingProfile;
    } else {
      profile.status = ProfileStatus.Follow;
      profile.modified = now;
      profile.followed = now;
      profile.circle = circle;

      // Put into cache and database.
      await this.putProfile(profile);
      return profile;
    }
  }

  async setFollowing(pubkey: string, pubkeys: string[]) {
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.following = pubkeys;
      return profile;
    });
  }

  async followingAndRelays(pubkey: string, following: string[], relays: any) {
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.following = following;
      profile.relays = relays;
      return profile;
    });
  }

  async setCircle(pubkey: string, circle?: number) {
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.circle = circle;
      return profile;
    });
  }

  async unfollow(pubkey: string) {
    const profile = await this.#updateProfileValues(pubkey, (profile) => {
      profile.status = ProfileStatus.Public;
      profile.followed = undefined;
      profile.circle = undefined;
      return profile;
    });

    await this.db.storage.deleteNotesByAuthor(pubkey);

    return profile;
  }

  async block(pubkey: string) {
    const profile = await this.#updateProfileValues(pubkey, (profile) => {
      profile.status = ProfileStatus.Block;
      profile.followed = undefined;
      profile.circle = undefined;
      return profile;
    });

    await this.db.storage.deleteNotesByAuthor(pubkey);

    return profile;
  }

  async unblock(pubkey: string) {
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.status = ProfileStatus.Public;
      return profile;
    });
  }

  async mute(pubkey: string) {
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.status = ProfileStatus.Mute;
      return profile;
    });
  }

  async unmute(pubkey: string) {
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.status = ProfileStatus.Follow;
      return profile;
    });
  }

  async deleteProfile(pubkey: string) {
    await this.db.storage.deleteProfile(pubkey);
  }

  isFollowing(pubkey: string) {
    const existingIndex = this.following.findIndex((p) => p.pubkey == pubkey);

    if (existingIndex === -1) {
      return false;
    }

    const profile = this.following[existingIndex];

    if (!profile) {
      return false;
    }

    return profile.status == ProfileStatus.Follow;
  }

  /** Update the profile if it already exists, ensuring we don't loose follow and block states. */
  async updateProfile(pubkey: string, document: NostrProfileDocument) {
    let profile = await this.db.storage.getProfile(pubkey);
    const now = this.utilities.now();

    if (!profile) {
      profile = document;
    } else {
      if (profile.created_at && document.created_at && profile.created_at >= document.created_at) {
        // If the existing profile is newer, ignore this update.
        return profile;
      }

      profile.name = document.name;
      profile.about = document.about;
      profile.nip05 = document.nip05;
      profile.lud06 = document.lud06;
      profile.lud16 = document.lud16;
      profile.website = document.website;
      profile.display_name = document.display_name;
      profile.picture = document.picture;
      profile.banner = document.banner;
      profile.created_at = document.created_at;
    }

    profile.modified = now;
    profile.retrieved = now;

    console.log('START PUT PROFILE', profile.name);
    // Put into cache and database.
    await this.putProfile(profile);
    console.log('END PUT PROFILE', profile.pubkey);

    // Insert this profile into the cache.
    this.#cache.set(profile.pubkey, profile);

    // If the profile that was written was our own, trigger the observable for it.
    if (this.appState.getPublicKey() === pubkey) {
      this.userProfileUpdated(profile);
    }

    if (profile && profile.followed) {
      const existingIndex = this.following.findIndex((p) => p.pubkey == profile!.pubkey);

      if (existingIndex === -1) {
        this.following.push(profile);
      } else {
        this.following[existingIndex] = profile;
      }
    }

    this.#updated();

    return profile;
  }

  async #updateProfileValues(pubkey: string, predicate: (value: NostrProfileDocument, key?: string) => NostrProfileDocument): Promise<NostrProfileDocument | undefined> {
    let profile = await this.db.storage.getProfile(pubkey);

    if (!profile) {
      return undefined;
    }

    profile.modified = this.utilities.now();

    // Update the profile
    profile = predicate(profile, profile.pubkey);

    // Update cache and database.
    await this.putProfile(profile);

    return profile;
  }

  emptyProfile(pubkey: string): NostrProfileDocument {
    return {
      npub: this.utilities.getNostrIdentifier(pubkey),
      name: this.utilities.getShortenedIdentifier(pubkey),
      about: '',
      picture: '/assets/profile.png',
      nip05: '',
      lud06: '',
      lud16: '',
      display_name: '',
      status: ProfileStatus.Public,
      website: '',
      created: Math.floor(Date.now() / 1000),
      verifications: [],
      pubkey: pubkey
    };
  }

  /** Wipes all profiles. */
  // async wipe() {
  //   await this.table.clear();
  //   this.profiles = [];
  //   this.#changed();
  // }
}
