import { Injectable } from '@angular/core';
import { NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private table;

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

  /** Will attempt to get the profile from local storage, if not available will attempt to get from relays. */
  async getProfile(pubkey: string) {
    const profile = await this.#get<NostrProfileDocument>(pubkey);

    if (!profile) {
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

  private async filter(predicate: (value: NostrProfileDocument, key: string) => boolean): Promise<NostrProfileDocument[]> {
    const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    const items = [];

    for await (const [key, value] of iterator) {
      if (predicate(value, key)) {
        value.pubkey = key;
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

  async #setFollow(pubkey: string, circle?: string, follow?: boolean) {
    let profile = await this.getProfile(pubkey);

    // This normally should not happen, but we should attempt to retrieve this profile.
    if (!profile) {
      profile = {
        name: '',
        about: '',
        picture: '',
        nip05: '',
        verifications: [],
        pubkey: pubkey,
        follow: follow,
        circle: circle,
      };
    } else {
      profile.follow = follow;
      profile.circle = circle;
    }

    // If user choose to follow, make sure there are no block.
    if (follow) {
      profile.block = undefined;
    }

    await this.putProfile(pubkey, profile);
  }

  async follow(pubkey: string, circle?: string) {
    return this.#setFollow(pubkey, circle, true);
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
    await this.putProfile(pubkey, profile);
  }

  async unblock(pubkey: string, follow?: boolean) {
    const profile = await this.getProfile(pubkey);

    if (!profile) {
      return;
    }

    profile.block = false;
    profile.follow = follow;
    this.putProfile(pubkey, profile);
  }

  /** Profiles are upserts, we replace the existing profile and only keep latest. */
  async putProfile(pubkey: string, document: NostrProfileDocument | any) {
    // Remove the pubkey from the document before we persist.
    delete document.pubkey;

    await this.table.put(pubkey, document);

    this.#changed();
  }

  /** Profiles are upserts, we replace the existing profile and only keep latest. */
  async deleteProfile(pubkey: string) {
    await this.table.del(pubkey);

    this.#changed();
  }

  /** Wipes all non-following profiles. */
  async clearBlocked() {
    const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });

    for await (const [key, value] of iterator) {
      if (value.block) {
        value.block = undefined;
        await this.putProfile(key, value);
      }
    }
  }

  /** Wipes all non-following profiles. */
  async wipeNonFollow() {
    const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });

    for await (const [key, value] of iterator) {
      if (!value.follow) {
        await this.table.del(key);
      }
    }

    this.#changed();
  }

  /** Wipes all profiles. */
  async wipe() {
    for await (const [key, value] of this.table.iterator({})) {
      await this.table.del(key);
    }

    this.#changed();
  }

  profiles: any = {};
}
