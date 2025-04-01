import { inject, Injectable } from '@angular/core';
import { ApplicationState } from './applicationstate';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument, StateDocument } from './interfaces';
import { Storage } from '../types/storage';
import { LoggerService } from './logger';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  storage!: Storage;
  state!: StateDocument;

  logger = inject(LoggerService);

  constructor(private appState: ApplicationState) {}

  async initialize(databaseName: string) {
    // Open the new storage database.
    this.storage = new Storage('blockcore-notes-' + this.appState.getPublicKey());
    await this.storage.open();

    let state = await this.storage.getState();

    if (!state) {
      // The initial since we will use is two days past.
      const timeAgo = Math.floor(new Date().getTime() / 1000) - (2 * 24 * 60 * 60);

      state = {
        id: 1,
        since: timeAgo,
        mediaQueue: [],
        metrics: { users: {} },
      };
    }

    this.state = state;

    // Update the state on interval.
    setTimeout(async () => {
      this.logger.info('Persisting state...');

      // The since will always be set slightly back in time to counteract difference in clocks
      // for different event creators on the nostr network.
      const timeAgo = Math.floor(new Date().getTime() / 1000) - (10 * 60);
      this.state.since = timeAgo;

      await this.saveState();
    }, 60 * 1000);

    // TODO: Remove, old code.
    // this.db = new DatabaseService(databaseName);
    // return this.db.open();
  }

  async clearAndReload() {
    this.logger.info('Deleting storage...');

    setTimeout(() => {
      this.logger.info('Reloading...');
      location.reload();
    }, 1000);

    try {
      // this.db.close();
      await this.delete();
    } catch (err) {
      this.logger.error('Failed to delete storage.', err);
    }
  }

  async saveState() {
    await this.storage.putState(this.state);
  }

  close() {
    try {
      this.storage.close();
    } catch (err) {
      this.logger.error('Failed to close storage.', err);
    }
  }

  async delete() {
    await this.storage.delete();
  }
}
