import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

export class StorageBase<T> {
  protected table;

  items: T[] = [];

  // Just a basic observable that triggers whenever any profile has changed.
  #changedSubject: BehaviorSubject<T[]> = new BehaviorSubject<T[]>(this.items);

  get items$(): Observable<T[]> {
    return this.#changedSubject.asObservable();
  }

  constructor(type: string, private storage: StorageService) {
    this.table = this.storage.table<T>(type);
  }

  #changed() {
    this.#changedSubject.next(this.items);
  }

  async #filter(predicate: (value: T, key: string) => boolean): Promise<T[]> {
    const iterator = this.table.iterator<string, T>({ keyEncoding: 'utf8', valueEncoding: 'json' });
    const results = [];

    for await (const [key, value] of iterator) {
      if (predicate(value, key)) {
        results.push(value);
      }
    }

    return results;
  }

  /** Populate the observable with items which we are following. */
  async initialize() {
    this.items = await this.list();
    this.#changed();
  }

  async list() {
    return this.#filter((value, key) => true);
  }

  /** Items are upserts, we replace the existing item and only keep latest. */
  async put(document: T | any) {
    const id = document.id;

    await this.table.put(id, document);

    const index = this.items.findIndex((i: any) => i.id == id);

    console.log('EXISTING INDEX:', index);
    console.log('EXISTING INDEX:', id);

    if (index === -1) {
      this.items.push(document);
    } else {
      this.items[index] = document;
    }

    this.#changed();
  }

  /** Delete a single item */
  async delete(id: string) {
    await this.table.del(id);

    const index = this.items.findIndex((i: any) => i.id == id);
    this.items.splice(index, 1);

    this.#changed();
  }

  /** Wipes all items. */
  async wipe() {
    for await (const [key, value] of this.table.iterator({})) {
      await this.table.del(key);
    }

    this.items = [];

    this.#changed();
  }
}
