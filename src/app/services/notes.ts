import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage';
import { liveQuery } from 'dexie';
import { dexieToRx } from '../shared/utilities';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private get table() {
    return this.db.notes;
  }

  items$ = dexieToRx(liveQuery(() => this.items()));

  async items() {
    return await this.table.toArray();
  }

  constructor(private db: StorageService) {}

  /** Notes are upserts, we replace the existing note and only keep latest. */
  async putNote(document: NostrNoteDocument | any) {
    await this.table.put(document);
  }

  async deleteNote(id: string) {
    await this.table.delete(id);
  }

  /** Wipes all notes. */
  async wipe() {
    await this.table.clear();
  }
}
