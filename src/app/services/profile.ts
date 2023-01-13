import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrProfile, NostrProfileDocument, ProfileStatus } from './interfaces';
import { BehaviorSubject, from, map, Observable, tap, shareReplay } from 'rxjs';
import * as moment from 'moment';
import { ApplicationState } from './applicationstate';
import { Utilities } from './utilities';
import { StorageService } from './storage';
import { liveQuery } from 'dexie';
import { CacheService } from './cache';
import { FetchService } from './fetch';
import { dexieToRx } from '../shared/utilities';
import { QueueService } from './queue';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private get table() {
    return this.db.profiles;
  }

  initialized = false;

  cache = new CacheService();

  item: NostrProfileDocument | undefined = undefined;

  #itemChanged: BehaviorSubject<NostrProfileDocument | undefined> = new BehaviorSubject<NostrProfileDocument | undefined>(this.item);

  get item$(): Observable<NostrProfileDocument | undefined> {
    return this.#itemChanged.asObservable();
  }

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

  // #profile: NostrProfileDocument;

  /** TODO: Destroy this array when there are zero subscribers left. */
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

  userProfileUpdated(profile: NostrProfileDocument | undefined) {
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

  #updatedItem() {
    this.#itemChanged.next(this.item);
  }

  setItem(item?: NostrProfileDocument) {
    this.item = item;
    this.#updatedItem();
  }

  /** Called whenever a profile has been updated, but only replace and trigger
   * update even if the newly downloaded profile is the same as the active UI selected item.
   */
  updateItemIfSelected(item?: NostrProfileDocument) {
    if (this.item?.pubkey !== item?.pubkey) {
      return;
    }

    this.item = item;
    this.#updatedItem();
  }

  setItemByPubKey(pubkey: string) {
    // If the pubkey as same as before, just trigger an changed event.
    if (this.item?.pubkey == pubkey) {
      this.#updatedItem();
      return;
    }

    this.getProfile(pubkey).subscribe((profile) => {
      this.item = profile;
      this.#updatedItem();
    });
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

  // blockedProfiles$ = liveQuery(() => this.blockedProfiles());

  async mutedPublicKeys() {
    const profiles = await this.mutedProfiles();
    return profiles.map((p) => p.pubkey);
  }

  // private keys: Map<string, string> = new Map<string, string>();

  // profilesSubject: BehaviorSubject<NostrProfileDocument[]> = new BehaviorSubject<NostrProfileDocument[]>([]);

  // Just a basic observable that triggers whenever any profile has changed.
  #profilesChangedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get profilesChanged$(): Observable<void> {
    return this.#profilesChangedSubject.asObservable();
  }

  #changed() {
    this.#profilesChangedSubject.next(undefined);
  }

  constructor(private db: StorageService, private queueService: QueueService, private fetchService: FetchService, private appState: ApplicationState, private utilities: Utilities) {}

  // async downloadProfile(pubkey: string) {
  //   this.#profileRequested.next(pubkey);
  // }

  downloadRecent(pubkey: string) {
    this.#profileRequested.next(pubkey);
  }

  // #getProfile(pubkey: string) {
  //   return new Observable((observer) => {
  //     this.table.get(pubkey).then((profile) => {
  //       if (profile) {
  //         debugger;
  //         observer.next(profile);
  //         observer.complete();
  //         return;
  //       }

  //       debugger;

  //       return this.dataService.downloadNewestProfiles([pubkey]);
  //     });
  //   });
  // }

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

            // this.dataService.downloadNewestProfiles([pubkey]).subscribe(async (profile) => {
            //   // TODO: Figure out why we get Promise back here and not the time. No time to debug anymore!
            //   const p = await profile;

            //   if (p) {
            //     this.updateProfile(p.pubkey, p);
            //   } else {
            //     console.log('NULL PROFILE!!');
            //     debugger;
            //   }
            // });
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

    this.updateItemIfSelected(profile);
  }

  // profileDownloadQueue: string[] = [];

  /** Will attempt to get the profile from local storage, if not available will attempt to get from relays. */
  // async getProfile(pubkey: string) {
  //   const profile = await this.#get<NostrProfileDocument>(pubkey);

  //   if (!profile) {
  //     await this.downloadProfile(pubkey);

  //     // if (!this.profileDownloadQueue.find((p) => p === pubkey)) {
  //     //   // Register this profile in queue for downloading
  //     //   this.profileDownloadQueue.unshift(pubkey);
  //     // }

  //     return;
  //   }

  //   profile.pubkey = pubkey;
  //   return profile;
  // }

  // async #get<T>(id: string): Promise<T | undefined> {
  //   if (!id) {
  //     return;
  //   }

  //   try {
  //     const entry = await this.table.get<string, T>(id, { keyEncoding: 'utf8', valueEncoding: 'json' });
  //     return entry;
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   } catch (err: any) {
  //     if (err.code === 'LEVEL_NOT_FOUND') {
  //       return undefined;
  //     } else {
  //       console.log('HERE?!?!?');
  //       throw err;
  //     }
  //   }
  // }

  async initialize(pubkey: string) {
    // Load the logged on user profile and have it immediately available.
    const profile = await this.getLocalProfile(pubkey);
    this.userProfileUpdated(profile);
  }

  /** Populate the observable with profiles which we are following. */
  // async populate() {
  //   // Load all profiles into memory upon startup.
  //   this.profiles = await this.filter(() => {
  //     return true;
  //   });

  //   this.initialized = true;
  //   this.#updated();

  //   const profile = this.profiles.find((p) => p.pubkey === this.appState.getPublicKey());
  //   this.userProfileUpdated(profile);
  // }

  // private async filter(predicate: (value: NostrProfileDocument, key: string) => boolean): Promise<NostrProfileDocument[]> {
  //   const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
  //   const items = [];

  //   for await (const [key, value] of iterator) {
  //     if (predicate(value, key)) {
  //       // value.pubkey = key;
  //       items.push(value);
  //     }
  //   }

  //   return items;
  // }

  // async followList(includePubKey?: string) {
  //   if (includePubKey) {
  //     return this.filter((value, key) => value.status == ProfileStatus.Follow || value.pubkey == includePubKey);
  //   } else {
  //     return this.filter((value, key) => value.status == ProfileStatus.Follow);
  //   }
  // }

  // inMemoryFollowList(includePubKey?: string) {
  //   if (includePubKey) {
  //     return this.profiles.filter((p) => p.status == ProfileStatus.Follow || p.pubkey == includePubKey);
  //   } else {
  //     return this.profiles.filter((p) => p.status == ProfileStatus.Follow);
  //   }
  // }

  // async publicList() {
  //   return this.filter((value, key) => value.status == ProfileStatus.Public);
  // }

  // async blockList() {
  //   return this.filter((value, key) => value.status == ProfileStatus.Block);
  // }

  async #setStatus(pubkey: string, status: ProfileStatus, circle?: number) {
    let profile = await this.table.get(pubkey);
    const now = Math.floor(Date.now() / 1000);

    if (!profile) {
      throw new Error('The profile does not exists.');
    }

    // // This normally should not happen, but we should attempt to retrieve this profile.
    // if (!profile) {
    //   // Does not already exists, let us retrieve the profile async.
    //   profile = {
    //     name: existingProfile ? existingProfile.name : '',
    //     about: existingProfile ? existingProfile.about : '',
    //     picture: existingProfile ? existingProfile.picture : '',
    //     nip05: existingProfile ? existingProfile.nip05 : '',
    //     lud06: existingProfile ? existingProfile.lud06 : '',
    //     display_name: existingProfile ? existingProfile.display_name : '',
    //     website: existingProfile ? existingProfile.website : '',
    //     verifications: existingProfile ? existingProfile.verifications : [],
    //     pubkey: pubkey,
    //     status: ProfileStatus.Follow,
    //     circle: circle,
    //     created: now,
    //   };
    // } else {
    if (profile.status == ProfileStatus.Block) {
      throw new Error('You have to unblock a user before you can follow again.');
    }

    profile.status = status;
    profile.circle = circle;
    profile.modified = now;

    // Put profile since we already got it in the beginning.
    await this.putProfile(profile);

    // if (!profile.retrieved) {
    //   await this.downloadProfile(pubkey);
    // } else {
    //   const now = moment();
    //   const date = moment.unix(profile.retrieved);
    //   var hours = now.diff(date, 'hours');

    //   // If it is more than 12 hours since we got the profile and user changed follow/unfollow/circle, we'll
    //   // go grab new data if available.
    //   if (hours > 12) {
    //     await this.downloadProfile(pubkey);
    //   }
    // }
  }

  /** Follow can be called without having an existing profile persisted. */
  async follow(pubkey: string, circle: number = 0, existingProfile?: NostrProfileDocument) {
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

      console.log('Created new empty profile: ', existingProfile);

      existingProfile.npub = this.utilities.getNostrIdentifier(existingProfile.pubkey);

      // Save directly, don't put in cache.
      await this.table.put(existingProfile);

      // Queue up to get this profile.
      this.queueService.enqueProfile(existingProfile.pubkey);

      // Now retrieve this profile
      // this.dataService.downloadNewestProfiles([pubkey]).subscribe(async (profile) => {
      //   // TODO: Figure out why we get Promise back here and not the time. No time to debug anymore!
      //   const p = await profile;

      //   console.log('Downloaded profile: ', p);

      //   if (p) {
      //     this.updateProfile(p.pubkey, p);
      //   } else {
      //     console.log('NULL PROFILE!!');
      //     debugger;
      //   }
      // });
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

  // async update(pubkey: string) {
  //   const profile = await this.getLocalProfile(pubkey);
  //   const now = moment().unix();

  //   if (profile) {
  //     profile.status = ProfileStatus.Public;
  //     profile.modified = now;

  //     return this.putProfile(profile);
  //   }
  // }

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

    // This shouldn't possibly be -1 for delete?
    // const index = this.#profileIndex(pubkey);
    // this.#profileRemove(index);

    // this.#changed();
  }

  // #profileIndex(pubkey: string) {
  //   return this.profiles.findIndex((p) => p.pubkey == pubkey);
  // }

  // #profileRemove(index: number) {
  //   this.profiles.splice(index, 1);
  // }

  async isFollowing(pubkey: string) {
    const profile = await this.table.get(pubkey);

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
      profile.name = document.name;
      profile.about = document.about;
      profile.nip05 = document.nip05;
      profile.lud06 = document.lud06;
      profile.lud16 = document.lud16;
      profile.website = document.website;
      profile.display_name = document.display_name;
      profile.picture = document.picture;
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

  /** Wipes all non-following profiles. */
  // async clearBlocked() {
  //   const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });

  //   for await (const [key, value] of iterator) {
  //     if (value.block) {
  //       await this.table.del(key);
  //     }
  //   }
  // }

  /** Wipes all non-following profiles, except blocked profiles. */
  // async wipeNonFollow() {
  //   const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });

  //   for await (const [key, value] of iterator) {
  //     if (!value.block && !value.follow) {
  //       await this.table.del(key);

  //       const index = this.#profileIndex(key);
  //       this.#profileRemove(index);
  //     }
  //   }

  //   this.#changed();
  // }

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
