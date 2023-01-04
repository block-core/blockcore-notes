import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private table;

  // Just a basic observable that triggers whenever any profile has changed.
  #notesChangedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get notesChanged$(): Observable<void> {
    return this.#notesChangedSubject.asObservable();
  }

  #changed() {
    this.#notesChangedSubject.next(undefined);
  }

  constructor(private storage: StorageService) {
    this.table = this.storage.table<NostrNoteDocument>('notes');
  }

  async #filter(predicate: (value: NostrNoteDocument, key: string) => boolean): Promise<NostrNoteDocument[]> {
    const iterator = this.table.iterator<string, NostrNoteDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    const items = [];

    for await (const [key, value] of iterator) {
      if (predicate(value, key)) {
        value.id = key;
        items.push(value);
      }
    }

    return items;
  }

  async list() {
    return this.#filter((value, key) => true);
  }

  /** Notes are upserts, we replace the existing note and only keep latest. */
  async putNote(document: NostrNoteDocument | any) {
    const id = document.id;

    // Remove the id from the document before we persist.
    // delete document.id;

    await this.table.put(id, document);

    this.#changed();
  }

  async deleteNote(id: string) {
    await this.table.del(id);

    this.#changed();
  }

  /** Wipes all notes. */
  async wipe() {
    for await (const [key, value] of this.table.iterator({})) {
      await this.table.del(key);
    }

    this.#changed();
  }
}
