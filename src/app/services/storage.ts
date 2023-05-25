import { Injectable } from '@angular/core';
import { ApplicationState } from './applicationstate';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument, StateDocument } from './interfaces';
import { Storage } from '../types/storage';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  storage!: Storage;
  state!: StateDocument;

  constructor(private appState: ApplicationState) {}

  async initialize(databaseName: string) {
    // Open the new storage database.
    this.storage = new Storage('blockcore-notes-' + this.appState.getPublicKey());
    await this.storage.open();

    let state = await this.storage.getState();

    if (!state) {
      // The initial since we will use is two days past.
      const timeAgo = moment().subtract(2, 'days').unix();

      state = {
        id: 1,
        since: timeAgo,
        mediaQueue: []
      };
    }

    this.state = state;

    // Update the state on interval.
    setTimeout(async () => {
      console.log('Persisting state...');

      // The since will always be set slightly back in time to counteract difference in clocks
      // for different event creators on the nostr network.
      const timeAgo = moment().subtract(10, 'minutes').unix();
      this.state.since = timeAgo;

      await this.saveState();
    }, 60 * 1000);

    // TODO: Remove, old code.
    // this.db = new DatabaseService(databaseName);
    // return this.db.open();
  }

  async clearAndReload() {
    console.log('Deleting storage...');

    setTimeout(() => {
      console.log('Reloading!');
      location.reload();
    }, 1000);

    try {
      // this.db.close();
      await this.delete();
    } catch (err) {
      console.error(err);
    }
  }

  async saveState() {
    await this.storage.putState(this.state);
  }

  close() {
    try {
      this.storage.close();
    } catch (err) {
      console.error('Failed to close storage.', err);
    }
  }

  async delete() {
    await this.storage.delete();
  }
}
