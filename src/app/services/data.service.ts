import { Injectable } from '@angular/core';
import { NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  daysToKeepProfiles = 14;

  constructor(private storage: StorageService, private profile: ProfileService) {}

  async initialize() {
    // Don't start the data processing until an initial timeout.
    setTimeout(() => {
      this.process();
    }, 5000);
  }

  async process() {
    console.log('Data Service Process Interval...');

    await this.cleanProfiles();

    setTimeout(async () => {
      await this.process();
    }, 5000);
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
  }
}
