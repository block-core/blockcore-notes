import { Injectable } from '@angular/core';
import { Circle } from './interfaces';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';
import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';
import { Utilities } from './utilities.service';

@Injectable({
  providedIn: 'root',
})
export class CircleService {
  static DEFAULT: Circle = { id: 0, name: 'Following', color: '#e91e63', style: '1', public: true };

  private table;

  circles: Circle[] = [];

  cache = new CacheService();

  items$ = from(liveQuery(() => this.items()));

  async items() {
    return await this.table.toArray();
  }

  // Just a basic observable that triggers whenever any profile has changed.
  #circlesChangedSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  get notesChanged$(): Observable<void> {
    return this.#circlesChangedSubject.asObservable();
  }

  #changed() {
    this.#circlesChangedSubject.next(undefined);
  }

  constructor(private db: DatabaseService, private utilities: Utilities) {
    this.table = this.db.circles;
  }

  /** Important to call to ensure we have the default circle added */
  async initialize() {
    const defaultCircle = await this.table.get(0);

    if (!defaultCircle) {
      await this.putCircle(CircleService.DEFAULT);
    }

    // Cache the circle so we can lookup quickly.
    this.items$.subscribe((circles) => {
      this.circles = circles;
    });
  }

  // async #filter(predicate: (value: Circle, key: string) => boolean): Promise<Circle[]> {
  //   const iterator = this.table.iterator<string, Circle>({ keyEncoding: 'utf8', valueEncoding: 'json' });

  //   // Add default that cannot be removed. It is where people go when group is deleted or when none is picked or could be found (matched).
  //   const items = [CirclesService.DEFAULT];

  //   for await (const [key, value] of iterator) {
  //     if (predicate(value, key)) {
  //       items.push(value);
  //     }
  //   }

  //   return items;
  // }

  // async list() {
  //   return this.#filter((value, key) => true);
  // }

  // async #get<T>(id: string): Promise<T | undefined> {
  //   try {
  //     const entry = await this.table.get<string, T>(id, { keyEncoding: 'utf8', valueEncoding: 'json' });
  //     return entry;
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   } catch (err: any) {
  //     if (err.code === 'LEVEL_NOT_FOUND') {
  //       return undefined;
  //     } else {
  //       console.log('HERE?!?!?');
  //       throw err;
  //     }
  //   }
  // }

  async getCircle(id?: number) {
    if (id == null) {
      return undefined;
    }

    // Use the cache if loaded already.
    if (this.circles.length > 0) {
      return this.circles.find((c) => c.id == id);
    } else {
      return this.table.get(id);
    }
  }

  async putCircle(document: Circle | any) {
    const now = this.utilities.now();

    if (!document.created) {
      document.created = now;
    }

    document.modified = now;

    await this.table.put(document);
  }

  async deleteCircle(id: number) {
    await this.table.delete(id);
  }

  /** Wipes all circles. */
  async wipe() {
    this.table.clear();
  }
}
