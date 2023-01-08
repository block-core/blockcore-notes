import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrProfile, NostrProfileDocument, ProfileStatus } from './interfaces';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import * as moment from 'moment';
import { ApplicationState } from './applicationstate.service';
import { Utilities } from './utilities.service';
import { DatabaseService } from './database.service';
import { liveQuery } from 'dexie';
import { CacheService } from './cache.service';
import { FetchService } from './fetch.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private table;

  initialized = false;

  cache = new CacheService();

  items$ = liveQuery(() => this.list(ProfileStatus.Follow));

  /** Returns a list of profiles based upon status. 0 = public, 1 = follow, 2 = mute, 3 = block */
  async list(status: ProfileStatus) {
    return await this.table.where('status').equals(status).toArray();
  }

  async query(equalityCriterias: { [key: string]: any }) {
    return await this.table.where(equalityCriterias).toArray();
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

  // async search(searchText: string) {
  //   return await this.filter((p) => p.name.toLowerCase().indexOf(searchText) > -1);
  // }

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

  blockedProfiles$ = liveQuery(() => this.blockedProfiles());

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

  constructor(private db: DatabaseService, private fetchService: FetchService, private appState: ApplicationState, private utilities: Utilities) {
    this.table = db.profiles;
  }

  async downloadProfile(pubkey: string) {
    this.#profileRequested.next(pubkey);
  }

  downloadRecent(pubkey: string) {
    this.#profileRequested.next(pubkey);
  }

  #getProfile(pubkey: string) {
    return new Observable((observer) => {
      this.table.get(pubkey).then((profile) => {
        if (profile) {
          observer.next(profile);
          observer.complete();
          return;
        }

        return this.fetchService.downloadNewestProfiles([pubkey]).pipe(
          map(async (event: any) => {
            // const p = profile as NostrEventDocument;
            const profile = this.utilities.mapProfileEvent(event);

            // Whenever we get here, also persist this profile to database.
            await this.table.put(profile);

            return profile;
          })
        );
      });

      return () => {
        console.log('FINISHED');
      };
    }).pipe(
      tap((profile) => {
        console.log('TAPPING ON PROFILE GET:', profile);
        // this.table.put(profile.pubkey);
      })
    );
  }

  async getLocalProfile(pubkey: string) {
    return this.table.get(pubkey);
  }

  getProfile(pubkey: string) {
    return this.cache.get(pubkey, this.#getProfile(pubkey));
  }

  async putProfile(profile: NostrProfileDocument) {
    this.cache.set(profile.pubkey, profile);
    await this.table.put(profile);
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

  /** Load all the following users into memory and cache. */
  async initialize() {
    // TODO!!
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

  async #setFollow(pubkey: string, circle?: number, follow?: boolean, existingProfile?: NostrProfileDocument) {
    let profile = await this.table.get(pubkey);
    //let profile = await this.getProfile(pubkey);

    debugger;

    const now = Math.floor(Date.now() / 1000);

    // This normally should not happen, but we should attempt to retrieve this profile.
    if (!profile) {
      // Does not already exists, let us retrieve the profile async.
      profile = {
        name: existingProfile ? existingProfile.name : '',
        about: existingProfile ? existingProfile.about : '',
        picture: existingProfile ? existingProfile.picture : '',
        nip05: existingProfile ? existingProfile.nip05 : '',
        lud06: existingProfile ? existingProfile.lud06 : '',
        display_name: existingProfile ? existingProfile.display_name : '',
        website: existingProfile ? existingProfile.website : '',
        verifications: existingProfile ? existingProfile.verifications : [],
        pubkey: pubkey,
        status: ProfileStatus.Follow,
        circle: circle,
        created: now,
      };
    } else {
      if (profile.status == ProfileStatus.Block) {
        throw new Error('You have to unblock a user before you can follow again.');
      }

      profile.status = ProfileStatus.Follow;
      profile.circle = circle;
    }

    profile.modified = now;

    // If user choose to follow, make sure there are no block.
    if (follow) {
      profile.followed = now;
    }

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

  async follow(pubkey: string, circle?: number, existingProfile?: NostrProfileDocument) {
    return this.#setFollow(pubkey, circle, true, existingProfile);
  }

  async setCircle(pubkey: string, circle?: number) {
    return this.updateProfileValue(pubkey, (p) => {
      p.circle = circle;
      return p;
    });
  }

  async unfollow(pubkey: string) {
    return this.#setFollow(pubkey, undefined, undefined);
  }

  async block(pubkey: string) {
    const profile = await this.table.get(pubkey);
    // const profile = await this.getProfile(pubkey);

    if (!profile) {
      return;
    }

    profile.status = ProfileStatus.Block;

    // Put it since we got it in the beginning.
    await this.putProfile(profile);
  }

  async unblock(pubkey: string, follow?: boolean) {
    const profile = await this.table.get(pubkey);
    // const profile = await this.getProfile(pubkey);

    if (!profile) {
      return;
    }

    profile.status = ProfileStatus.Public;

    // Put it since we got it in the beginning.
    await this.putProfile(profile);
  }

  // TODO: Avoid duplicate code and use the update predicate!
  async mute(pubkey: string) {
    // const profile = await this.getProfile(pubkey);
    const profile = await this.table.get(pubkey);

    if (!profile) {
      return;
    }

    profile.status = ProfileStatus.Mute;

    // Put it since we got it in the beginning.
    await this.putProfile(profile);
  }

  // TODO: Avoid duplicate code and use the update predicate!
  async unmute(pubkey: string, follow?: boolean) {
    // const profile = await this.getProfile(pubkey);
    const profile = await this.table.get(pubkey);

    if (!profile) {
      return;
    }

    profile.status = ProfileStatus.Follow;

    // Put it since we got it in the beginning.
    await this.putProfile(profile);
  }

  friends$ = liveQuery(() => this.listFriends());

  async listFriends() {
    console.log('LIST FRIENDS!');
    //
    // Query the DB using our promise based API.
    // The end result will magically become
    // observable.
    //
    return await this.db.profiles
      // .where('follow')
      // .equals('true')
      // .between(18, 65)
      .toArray();
  }

  /** Profiles are upserts, we replace the existing profile and only keep latest. */
  // async putProfile(pubkey: string, document: NostrProfileDocument | any) {
  //   // Remove the pubkey from the document before we persist.
  //   // delete document.pubkey;

  //   console.log('SAVING:', document);
  //   document.pubkey = pubkey;

  //   await this.db.profiles.put(document, pubkey);

  //   await this.table.put(pubkey, document);

  //   const index = this.#profileIndex(pubkey);

  //   if (index == -1) {
  //     this.profiles.push(document);
  //   } else {
  //     this.profiles[index] = document;
  //   }

  //   this.#changed();
  // }

  #profileIndex(pubkey: string) {
    return this.profiles.findIndex((p) => p.pubkey == pubkey);
  }

  #profileRemove(index: number) {
    this.profiles.splice(index, 1);
  }

  async deleteProfile(pubkey: string) {
    await this.table.delete(pubkey);

    // This shouldn't possibly be -1 for delete?
    const index = this.#profileIndex(pubkey);
    this.#profileRemove(index);

    this.#changed();
  }

  async isFollowing(pubkey: string) {
    const profile = await this.table.get(pubkey);

    if (!profile) {
      return false;
    }

    return profile.status == ProfileStatus.Follow;
  }

  /** Update the profile if it already exists, ensuring we don't loose follow and block states. */
  async updateProfile(pubkey: string, document: NostrProfileDocument | any) {
    let profile = await this.table.get(pubkey);
    // let profile = await this.getProfile(pubkey);

    const now = Math.floor(Date.now() / 1000);

    if (!profile) {
      profile = document;
    } else {
      profile.name = document.name;
      profile.about = document.about;
      profile.nip05 = document.nip05;
      profile.lud06 = document.lud06;
      profile.website = document.website;
      profile.display_name = document.display_name;
      profile.picture = document.picture;
    }

    profile!.modified = now;
    profile!.retrieved = now;

    await this.putProfile(profile!);

    // If the profile that was written was our own, trigger the observable for it.
    if (this.appState.getPublicKey() === pubkey) {
      this.userProfileUpdated(profile);
    }
  }

  async updateProfileValue(pubkey: string, predicate: (value: NostrProfileDocument, key: string) => NostrProfileDocument): Promise<void> {
    // let profile = await this.getProfile(pubkey);
    let profile = await this.table.get(pubkey);

    if (!profile) {
      return undefined;
    }

    profile.modified = Math.floor(Date.now() / 1000);

    // Update the profile
    profile = predicate(profile, profile.pubkey);

    // We already updated latest, do a put and not update.
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
      name: this.utilities.getShortenedIdentifier(pubkey),
      about: '',
      picture: '/assets/profile.png',
      nip05: '',
      lud06: '',
      display_name: '',
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
