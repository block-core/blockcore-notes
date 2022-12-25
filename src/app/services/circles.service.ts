import { Injectable } from '@angular/core';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CirclesService {
  private table;

  // Just a basic observable that triggers whenever any profile has changed.
  #circlesChangedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get notesChanged$(): Observable<void> {
    return this.#circlesChangedSubject.asObservable();
  }

  #changed() {
    this.#circlesChangedSubject.next(undefined);
  }

  constructor(private storage: StorageService) {
    this.table = this.storage.table<Circle>('notes');
  }

  async #filter(predicate: (value: Circle, key: string) => boolean): Promise<Circle[]> {
    const iterator = this.table.iterator<string, Circle>({ keyEncoding: 'utf8', valueEncoding: 'json' });
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

  /** Circles are upserts, we replace the existing circles and only keep latest. */
  async putCircle(document: Circle | any) {
    const id = document.id;

    // Remove the id from the document before we persist.
    delete document.id;

    await this.table.put(id, document);

    this.#changed();
  }

  async deleteCircle(id: string) {
    await this.table.del(id);

    this.#changed();
  }

  /** Wipes all circles. */
  async wipe() {
    for await (const [key, value] of this.table.iterator({})) {
      await this.table.del(key);
    }

    this.#changed();
  }
}
