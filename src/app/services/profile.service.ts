import { Injectable } from '@angular/core';
import { NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private table;

  initialized = false;

  /** TODO: Destroy this array when there are zero subscribers left. */
  profiles: NostrProfileDocument[] = [];

  #profilesChanged: BehaviorSubject<NostrProfileDocument[]> = new BehaviorSubject<NostrProfileDocument[]>(this.profiles);

  get profiles$(): Observable<NostrProfileDocument[]> {
    return this.#profilesChanged.asObservable();
  }

  #profileRequested: BehaviorSubject<string> = new BehaviorSubject<string>('');

  get profileRequested$(): Observable<string> {
    return this.#profileRequested.asObservable();
  }

  #updated() {
    this.#profilesChanged.next(this.profiles);
  }

  mutedPublicKeys() {
    return this.profiles.filter((p) => p.mute).map((p) => p.pubkey);
  }

  blockedPublickKeys() {
    return this.profiles.filter((p) => p.block).map((p) => p.pubkey);
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

  constructor(private storage: StorageService) {
    this.table = this.storage.table<NostrProfileDocument>('profile');
  }

  async downloadProfile(pubkey: string) {
    this.#profileRequested.next(pubkey);
  }

  async downloadRecent(pubkey: string) {
    this.#profileRequested.next(pubkey);
  }

  // profileDownloadQueue: string[] = [];

  /** Will attempt to get the profile from local storage, if not available will attempt to get from relays. */
  async getProfile(pubkey: string) {
    const profile = await this.#get<NostrProfileDocument>(pubkey);

    if (!profile) {
      await this.downloadProfile(pubkey);

      // if (!this.profileDownloadQueue.find((p) => p === pubkey)) {
      //   // Register this profile in queue for downloading
      //   this.profileDownloadQueue.unshift(pubkey);
      // }

      return;
    }

    profile.pubkey = pubkey;
    return profile;
  }

  async #get<T>(id: string): Promise<T | undefined> {
    try {
      const entry = await this.table.get<string, T>(id, { keyEncoding: 'utf8', valueEncoding: 'json' });
      return entry;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.code === 'LEVEL_NOT_FOUND') {
        return undefined;
      } else {
        console.log('HERE?!?!?');
        throw err;
      }
    }
  }

  /** Populate the observable with profiles which we are following. */
  async populate() {
    this.profiles = await this.followList();
    this.initialized = true;
    this.#updated();
  }

  private async filter(predicate: (value: NostrProfileDocument, key: string) => boolean): Promise<NostrProfileDocument[]> {
    const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    const items = [];

    for await (const [key, value] of iterator) {
      if (predicate(value, key)) {
        // value.pubkey = key;
        items.push(value);
      }
    }

    return items;
  }

  async followList() {
    return this.filter((value, key) => value.follow == true);
  }

  async publicList() {
    return this.filter((value, key) => !value.follow && !value.block);
  }

  async blockList() {
    return this.filter((value, key) => value.block == true);
  }

  async #setFollow(pubkey: string, circle?: string, follow?: boolean, existingProfile?: NostrProfileDocument) {
    let profile = await this.getProfile(pubkey);

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
        follow: follow,
        circle: circle,
        created: now,
      };
    } else {
      if (profile.block == true) {
        throw new Error('You have to unblock a user before you can follow again.');
      }

      profile.follow = follow;
      profile.circle = circle;
    }

    profile.modified = now;

    // If user choose to follow, make sure there are no block.
    if (follow) {
      profile.block = undefined;
      profile.followed = now;
    }

    // Put profile since we already got it in the beginning.
    await this.putProfile(pubkey, profile);

    if (!profile.retrieved) {
      await this.downloadProfile(pubkey);
    } else {
      const now = moment();
      const date = moment.unix(profile.retrieved);
      var hours = now.diff(date, 'hours');

      // If it is more than 12 hours since we got the profile and user changed follow/unfollow/circle, we'll
      // go grab new data if available.
      if (hours > 12) {
        await this.downloadProfile(pubkey);
      }
    }
  }

  async follow(pubkey: string, circle?: string, existingProfile?: NostrProfileDocument) {
    return this.#setFollow(pubkey, circle, true, existingProfile);
  }

  async unfollow(pubkey: string) {
    return this.#setFollow(pubkey, undefined, undefined);
  }

  async block(pubkey: string) {
    const profile = await this.getProfile(pubkey);

    if (!profile) {
      return;
    }

    profile.block = true;
    profile.follow = false;

    // Put it since we got it in the beginning.
    await this.putProfile(pubkey, profile);
  }

  async unblock(pubkey: string, follow?: boolean) {
    const profile = await this.getProfile(pubkey);

    if (!profile) {
      return;
    }

    profile.block = false;
    profile.follow = follow;

    // Put it since we got it in the beginning.
    this.putProfile(pubkey, profile);
  }

  // TODO: Avoid duplicate code and use the update predicate!
  async mute(pubkey: string) {
    const profile = await this.getProfile(pubkey);

    if (!profile) {
      return;
    }

    profile.mute = true;

    // Put it since we got it in the beginning.
    await this.putProfile(pubkey, profile);
  }

  // TODO: Avoid duplicate code and use the update predicate!
  async unmute(pubkey: string, follow?: boolean) {
    const profile = await this.getProfile(pubkey);

    if (!profile) {
      return;
    }

    profile.mute = false;

    // Put it since we got it in the beginning.
    this.putProfile(pubkey, profile);
  }

  /** Profiles are upserts, we replace the existing profile and only keep latest. */
  async putProfile(pubkey: string, document: NostrProfileDocument | any) {
    // Remove the pubkey from the document before we persist.
    // delete document.pubkey;

    await this.table.put(pubkey, document);

    const index = this.#profileIndex(pubkey);

    if (index == -1) {
      this.profiles.push(document);
    } else {
      this.profiles[index] = document;
    }

    this.#changed();
  }

  #profileIndex(pubkey: string) {
    return this.profiles.findIndex((p) => p.pubkey == pubkey);
  }

  #profileRemove(index: number) {
    this.profiles.splice(index, 1);
  }

  async deleteProfile(pubkey: string) {
    await this.table.del(pubkey);

    // This shouldn't possibly be -1 for delete?
    const index = this.#profileIndex(pubkey);
    this.#profileRemove(index);

    this.#changed();
  }

  /** Update the profile if it already exists, ensuring we don't loose follow and block states. */
  async updateProfile(pubkey: string, document: NostrProfileDocument | any) {
    let profile = await this.getProfile(pubkey);

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

    await this.putProfile(pubkey, profile);
  }

  async updateProfileValue(pubkey: string, predicate: (value: NostrProfileDocument, key: string) => NostrProfileDocument): Promise<void> {
    let profile = await this.getProfile(pubkey);

    if (!profile) {
      return undefined;
    }

    profile.modified = Math.floor(Date.now() / 1000);

    // Update the profile
    profile = predicate(profile, profile.pubkey);

    // We already updated latest, do a put and not update.
    await this.putProfile(pubkey, profile);
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
  async wipeNonFollow() {
    const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });

    for await (const [key, value] of iterator) {
      if (!value.block && !value.follow) {
        await this.table.del(key);

        const index = this.#profileIndex(key);
        this.#profileRemove(index);
      }
    }

    this.#changed();
  }

  /** Wipes all profiles. */
  async wipe() {
    for await (const [key, value] of this.table.iterator({})) {
      await this.table.del(key);
    }

    this.profiles = [];

    this.#changed();
  }
}
