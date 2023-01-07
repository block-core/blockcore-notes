import { Injectable } from '@angular/core';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { liveQuery } from 'dexie';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class CirclesService {
  static DEFAULT: Circle = { name: 'Following', color: '#e91e63', style: '1', public: true, created: Math.floor(Date.now() / 1000) };

  private table;
  private table2;

  // Just a basic observable that triggers whenever any profile has changed.
  #circlesChangedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get notesChanged$(): Observable<void> {
    return this.#circlesChangedSubject.asObservable();
  }

  #changed() {
    this.#circlesChangedSubject.next(undefined);
  }

  circles$ = liveQuery(() => this.listCircles());

  constructor(private storage: StorageService, private db: DatabaseService) {
    this.table = this.storage.table<Circle>('circles');
    this.table2 = this.db.circles;
  }

  async #filter(predicate: (value: Circle, key: string) => boolean): Promise<Circle[]> {
    const iterator = this.table.iterator<string, Circle>({ keyEncoding: 'utf8', valueEncoding: 'json' });

    // Add default that cannot be removed. It is where people go when group is deleted or when none is picked or could be found (matched).
    const items = [CirclesService.DEFAULT];

    for await (const [key, value] of iterator) {
      if (predicate(value, key)) {
        items.push(value);
      }
    }

    return items;
  }

  async listCircles() {
    return await this.db.circles.toArray();
  }

  async list() {
    return this.#filter((value, key) => true);
  }

  async #get<T>(id: string): Promise<T | undefined> {
    try {
      const entry = await this.table.get<string, T>(id, { keyEncoding: 'utf8', valueEncoding: 'json' });
      return entry;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.code === 'LEVEL_NOT_FOUND') {
        return undefined;
      } else {
        console.log('HERE?!?!?');
        throw err;
      }
    }
  }

  async getCircle(id?: number) {
    if (!id) {
      return CirclesService.DEFAULT;
    }

    let circle = await this.table2.get(id);
    // const circle = await this.#get<Circle>(id);

    if (!circle) {
      circle = CirclesService.DEFAULT;
      circle.id = id;
    }

    return circle;
  }

  /** Circles are upserts, we replace the existing circles and only keep latest. */
  async putCircle(document: Circle | any) {
    document.created = Math.floor(Date.now() / 1000);
    await this.table2.put(document);
    // this.#changed();
  }

  async deleteCircle(id: number) {
    await this.table2.delete(id);
    // this.#changed();
  }

  /** Wipes all circles. */
  async wipe() {
    this.table2.clear();

    // this.#changed();
  }
}
