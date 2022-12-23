import { Injectable } from '@angular/core';
import { NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private table;

  constructor(private storage: StorageService) {
    this.table = this.storage.table<NostrProfileDocument>('profile');
  }

  /** Will attempt to get the profile from local storage, if not available will attempt to get from relays. */
  async getProfile(pubkey: string) {
    const profile = await this.table.get(pubkey);
    profile.pubkey = pubkey;
    return profile;
  }

  // /** Will attempt to get the profile from local storage. */
  // async getProfiles(pubkeys: string[]) {
  //   await this.table.getMany(pubkeys);
  // }

  async list() {
    const iterator = this.table.iterator<string, NostrProfileDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    const items = [];

    for await (const [key, value] of iterator) {
      value.pubkey = key;
      items.push(value);
    }

    return items;
  }

  /** Profiles are upserts, we replace the existing profile and only keep latest. */
  async putProfile(pubkey: string, document: NostrProfileDocument | any) {
    // Remove the pubkey from the document before we persist.
    delete document.pubkey;

    await this.table.put(pubkey, document);
  }

  /** Profiles are upserts, we replace the existing profile and only keep latest. */
  async deleteProfile(pubkey: string) {
    await this.table.del(pubkey);
  }

  async wipe() {
    for await (const [key, value] of this.table.iterator({})) {
      await this.table.del(key);
    }
  }

  profiles: any = {};
}
