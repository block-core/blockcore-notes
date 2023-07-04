import { Injectable } from '@angular/core';
import { Circle } from './interfaces';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { StorageService } from './storage';
import { Utilities } from './utilities';

@Injectable({
  providedIn: 'root',
})
export class CircleService {
  static DEFAULT: Circle[] = [
    { id: 0, name: 'Following', color: '#e91e63', style: 1, public: true },
    { id: 1, name: 'Text', color: '#7cb342', style: 2, public: true },
    { id: 2, name: 'Photo', color: '#ffb300', style: 3, public: true },
    { id: 3, name: 'Film', color: '#26c6da', style: 4, public: true },
    { id: 4, name: 'Music', color: '#ba9eea', style: 5, public: true },
    { id: 5, name: 'Podcast', color: '#ff8a65', style: 6, public: true },
    { id: 6, name: 'Private', color: '#607d8b', style: 1, public: false },
  ];

  circles: Circle[] = [];

  // items$ = dexieToRx(liveQuery(() => this.items()));

  // async items() {
  //   return await this.table.toArray();
  // }

  constructor(private db: StorageService, private utilities: Utilities) {}

  /** Important to call to ensure we have the default circle added */
  async initialize() {
    const defaultCircle = await this.db.storage.getCircle(0);

    if (!defaultCircle) {
      for (let index = 0; index < CircleService.DEFAULT.length; index++) {
        const element = CircleService.DEFAULT[index];
        await this.put(element);
      }
    }

    this.circles = await this.db.storage.getCircles();
  }

  getSync(id?: number) {
    if (this.circles.length > 0) {
      return this.circles.find((c) => c.id == id);
    }

    return undefined;
  }

  async get(id?: number) {
    if (id == null) {
      return undefined;
    }

    // Use the cache if loaded already.
    if (this.circles.length > 0) {
      return this.circles.find((c) => c.id == id);
    } else {
      return await this.db.storage.getCircle(id);
    }
  }

  async put(document: Circle | any) {
    const now = this.utilities.now();

    if (!document.created) {
      document.created = now;
    }

    document.modified = now;

    const index = this.circles.findIndex((c) => c.id == document.id);

    if (index > -1) {
      this.circles[index] = document;
    } else {
      this.circles.push(document);
    }

    const id = await this.db.storage.putCircle(document);

    // Important that we update the document with sequence ID from database.
    document.id = id;
  }

  async delete(id: number) {
    const index = this.circles.findIndex((c) => c.id == id);

    if (index > -1) {
      this.circles.splice(index, 1);
    }

    await this.db.storage.deleteCircle(id);
  }
}
