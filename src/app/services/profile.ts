import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrProfile, NostrProfileDocument, ProfileStatus } from './interfaces';
import { BehaviorSubject, from, map, Observable, tap, shareReplay } from 'rxjs';
import { ApplicationState } from './applicationstate';
import { Utilities } from './utilities';
import { StorageService } from './storage';
import { liveQuery } from 'dexie';
import { CacheService } from './cache';
import { dexieToRx } from '../shared/utilities';
import { QueueService } from './queue';
import { UIService } from './ui';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private get table() {
    return this.db.profiles;
  }

  initialized = false;

  cache = new CacheService();

  items$ = dexieToRx(liveQuery(() => this.list(ProfileStatus.Follow)));

  /** Returns a list of profiles based upon status. 0 = public, 1 = follow, 2 = mute, 3 = block */
  async list(status: ProfileStatus) {
    return await this.table.where('status').equals(status).toArray();
  }

  async query(equalityCriterias: { [key: string]: any }) {
    return await this.table.where(equalityCriterias).toArray();
  }

  blockedProfiles$() {
    return dexieToRx(liveQuery(() => this.list(ProfileStatus.Block)));
  }

  publicProfiles$() {
    return dexieToRx(liveQuery(() => this.list(ProfileStatus.Public)));
  }

  mutedProfiles$() {
    return dexieToRx(liveQuery(() => this.list(ProfileStatus.Mute)));
  }

  /** The profiles the user is following. */
  profiles: NostrProfileDocument[] = [];

  #followingChanged: BehaviorSubject<NostrProfileDocument[]> = new BehaviorSubject<NostrProfileDocument[]>(this.profiles);

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

  #profilesChanged: BehaviorSubject<NostrProfileDocument[]> = new BehaviorSubject<NostrProfileDocument[]>(this.profiles);

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
    this.#profilesChanged.next(this.profiles);
    this.#followingChanged.next(this.profiles);
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

  async search(searchText: string) {
    // this.table.filter((x) => x.name.toLowerCase().indexOf(searchText) > -1).toArray();
    return this.table
      .filter((profile) => {
        if (profile.status == 3) {
          // Filter out blocked results.
          return false;
        }

        let index = profile.name?.toLocaleLowerCase().indexOf(searchText);

        if (index > -1) {
          return true;
        }

        index = profile.nip05?.toLocaleLowerCase().indexOf(searchText);

        if (index > -1) {
          return true;
        }

        index = profile.display_name?.toLocaleLowerCase().indexOf(searchText);

        if (index > -1) {
          return true;
        }

        return false;
      })
      .toArray();
  }

  mutedProfiles() {
    return this.query({ status: ProfileStatus.Mute });
  }

  blockedProfiles() {
    return this.query({ status: ProfileStatus.Block });
  }

  async blockedPublicKeys() {
    const profiles = await this.blockedProfiles();
    return profiles.map((p) => p.pubkey);
  }

  async mutedPublicKeys() {
    const profiles = await this.mutedProfiles();
    return profiles.map((p) => p.pubkey);
  }

  // Just a basic observable that triggers whenever any profile has changed.
  #profilesChangedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get profilesChanged$(): Observable<void> {
    return this.#profilesChangedSubject.asObservable();
  }

  #changed() {
    this.#profilesChangedSubject.next(undefined);
  }

  constructor(private db: StorageService, private ui: UIService, private queueService: QueueService, private appState: ApplicationState, private utilities: Utilities) {
    this.ui.pubkey$.subscribe((pubkey) => {
      if (!pubkey) {
        this.ui.setProfile(undefined);
      } else {
        this.getProfile(pubkey).subscribe((profile) => {
          this.ui.setProfile(profile);
        });
      }
    });
  }

  getProfileOrDownload(pubkey: string) {
    return (
      new Observable((observer) => {
        this.table
          .get(pubkey)
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
    return this.table.get(pubkey);
  }

  getProfile(pubkey: string) {
    return this.cache.get(pubkey, this.getProfileOrDownload(pubkey));
  }

  async putProfile(profile: NostrProfileDocument) {
    if (profile.status == null) {
      profile.status = 0;
    }

    // We should do this only once when first observing the profile, but for data migration we'll do it
    // on every save. This is more optimal than on every rendering.
    profile.npub = this.utilities.getNostrIdentifier(profile.pubkey);

    this.cache.set(profile.pubkey, profile);
    await this.table.put(profile);
    this.#putFollowingProfile(profile);

    this.updateItemIfSelected(profile);
  }

  async initialize(pubkey: string) {
    // Load the logged on user profile and have it immediately available.
    const profile = await this.getLocalProfile(pubkey);
    this.userProfileUpdated(profile);

    // Perform initial population of .profiles, which contains profile the user is following.
    const items = await this.table.where('status').equals(1).toArray();
    this.profiles = items;
    this.#profilesChanged.next(this.profiles);
  }

  async #setStatus(pubkey: string, status: ProfileStatus, circle?: number) {
    let profile = await this.table.get(pubkey);
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
    const existingIndex = this.profiles.findIndex((p) => p.pubkey == profile.pubkey);

    if (existingIndex === -1) {
      this.profiles.push(profile);
    } else {
      this.profiles[existingIndex] = profile;
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
      await this.table.put(existingProfile);
      this.#putFollowingProfile(existingProfile);

      // Queue up to get this profile.
      this.queueService.enqueProfile(existingProfile.pubkey);
    } else {
      profile.status = ProfileStatus.Follow;
      profile.modified = now;
      profile.followed = now;
      profile.circle = circle;

      // Put into cache and database.
      await this.putProfile(profile);
    }
  }

  async following(pubkey: string, pubkeys: string[]) {
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
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.status = ProfileStatus.Public;
      profile.followed = undefined;
      profile.circle = undefined;
      return profile;
    });
  }

  async block(pubkey: string) {
    return this.#updateProfileValues(pubkey, (profile) => {
      profile.status = ProfileStatus.Block;
      profile.followed = undefined;
      profile.circle = undefined;
      return profile;
    });
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
    await this.table.delete(pubkey);
  }

  isFollowing(pubkey: string) {
    const existingIndex = this.profiles.findIndex((p) => p.pubkey == pubkey);

    if (existingIndex === -1) {
      return false;
    }

    const profile = this.profiles[existingIndex];

    if (!profile) {
      return false;
    }

    return profile.status == ProfileStatus.Follow;
  }

  /** Update the profile if it already exists, ensuring we don't loose follow and block states. */
  async updateProfile(pubkey: string, document: NostrProfileDocument) {
    let profile = await this.table.get(pubkey);
    const now = this.utilities.now();

    if (!profile) {
      profile = document;
    } else {
      if (profile.created_at && document.created_at && profile.created_at >= document.created_at) {
        // If the existing profile is newer, ignore this update.
        return;
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

    // Put into cache and database.
    await this.putProfile(profile);

    // If the profile that was written was our own, trigger the observable for it.
    if (this.appState.getPublicKey() === pubkey) {
      this.userProfileUpdated(profile);
    }
  }

  async #updateProfileValues(pubkey: string, predicate: (value: NostrProfileDocument, key?: string) => NostrProfileDocument): Promise<void> {
    let profile = await this.table.get(pubkey);

    if (!profile) {
      return undefined;
    }

    profile.modified = this.utilities.now();

    // Update the profile
    profile = predicate(profile, profile.pubkey);

    // Update cache and database.
    await this.putProfile(profile);
  }

  emptyProfile(pubkey: string): NostrProfileDocument {
    return {
      npub: this.utilities.getNostrIdentifier(pubkey),
      name: this.utilities.getShortenedIdentifier(pubkey),
      about: '',
      picture: '/assets/profile.png',
      nip05: '',
      lud06: '',
      display_name: '',
      status: ProfileStatus.Public,
      website: '',
      created: Math.floor(Date.now() / 1000),
      verifications: [],
      pubkey: pubkey,
    };
  }

  /** Wipes all profiles. */
  async wipe() {
    await this.table.clear();
    this.profiles = [];
    this.#changed();
  }
}
