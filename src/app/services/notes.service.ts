import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { DatabaseService } from './database.service';
import { liveQuery } from 'dexie';

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

  items$ = from(liveQuery(() => this.items()));

  async items() {
    return await this.table.toArray();
  }

  /** List of events for the current view, which might not be persisted. */
  // currentViewNotes: NostrEventDocument[] = [];

  constructor(private db: DatabaseService) {
    this.table = this.db.notes;
  }

  // async #filter(predicate: (value: NostrNoteDocument, key: string) => boolean): Promise<NostrNoteDocument[]> {
  //   const iterator = this.table.iterator<string, NostrNoteDocument>({ keyEncoding: 'utf8', valueEncoding: 'json' });
  //   const items = [];

  //   for await (const [key, value] of iterator) {
  //     if (predicate(value, key)) {
  //       value.id = key;
  //       items.push(value);
  //     }
  //   }

  //   return items;
  // }

  // async list() {
  //   return this.#filter((value, key) => true);
  // }

  /** Notes are upserts, we replace the existing note and only keep latest. */
  async putNote(document: NostrNoteDocument | any) {
    await this.table.put(document);
    this.#changed();
  }

  async deleteNote(id: string) {
    await this.table.delete(id);
    this.#changed();
  }

  /** Wipes all notes. */
  async wipe() {
    await this.table.clear();
    this.#changed();
  }
}
