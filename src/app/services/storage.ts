import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { ApplicationState } from './applicationstate';
import { DatabaseService } from './database';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument } from './interfaces';
import { Storage } from '../types/storage';

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

  async initialize(databaseName: string) {
    // Open the new storage database.
    this.storage = new Storage('blockcore-notes-' + this.appState.getPublicKey(), 1);
    await this.storage.open();

    // TODO: Remove, old code.
    this.db = new DatabaseService(databaseName);
    return this.db.open();
  }

  close() {
    this.db.close();
  }

  async delete() {
    return this.db.delete();
  }
}
