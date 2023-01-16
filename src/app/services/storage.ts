import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { DatabaseService } from './database';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
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
