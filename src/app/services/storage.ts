import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { ApplicationState } from './applicationstate';
import { DatabaseService } from './database';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument, StateDocument } from './interfaces';
import { Storage } from '../types/storage';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  storage!: Storage;

  constructor(private appState: ApplicationState) {}

  get events(): Table<NostrEventDocument, string> {
    return this.db.events;
  }

  get notes(): Table<NostrNoteDocument, string> {
    return this.db.notes;
  }

  get profiles(): Table<NostrProfileDocument, string> {
    return this.db.profiles;
  }

  get circles(): Table<Circle, number> {
    return this.db.circles;
  }

  get relays(): Table<NostrRelayDocument, string> {
    return this.db.relays;
  }

  db!: DatabaseService;
  state!: StateDocument;

  async initialize(databaseName: string) {
    // Open the new storage database.
    this.storage = new Storage('blockcore-notes-' + this.appState.getPublicKey(), 1);
    await this.storage.open();

    let state = await this.storage.getState();

    if (!state) {
      // The initial since we will use is two days past.
      const timeAgo = moment().subtract(2, 'days').unix();

      state = {
        id: 1,
        since: timeAgo,
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

      await this.storage.putState(this.state);
    }, 60 * 1000);

    // TODO: Remove, old code.
    // this.db = new DatabaseService(databaseName);
    // return this.db.open();
  }

  close() {
    this.db.close();
  }

  async delete() {
    return this.db.delete();
  }
}
