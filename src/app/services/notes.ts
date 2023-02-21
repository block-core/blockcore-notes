import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  items: NostrNoteDocument[] = [];
  filtered: NostrNoteDocument[] = [];

  constructor(private db: StorageService) {}

  /** Notes are upserts, we replace the existing note and only keep latest. */
  async putNote(document: NostrNoteDocument | any) {
    await this.db.storage.putNote(document);
  }

  async deleteNote(id: string) {
    await this.db.storage.deleteNote(id);
  }

  async load() {
    this.items = await this.db.storage.getNotes();
    this.filterByLabels([]);
  }

  filterByLabels(labels: string[]) {
    if (labels.length == 0) {
      // this.filtered = this.items.slice(0, 5);
      this.filtered = this.items;
    } else {
      this.filtered = this.items.filter((n) => n.labels != null && n.labels.some((l) => labels.includes(l)));
    }
  }

  /** Wipes all notes. */
  async wipe() {
    await this.db.storage.deleteNotes();
  }
}
