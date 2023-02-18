interface CacheContent {
  accessed: number;
  value: any;
}

export class CacheService {
  constructor(private maxEntries: number) {}

  #cache: Map<string, CacheContent> = new Map<string, CacheContent>();

  get(key: string) {
    const val = this.#cache.get(key);

    if (!val) {
      return undefined;
    }

    // Only when there are many we'll start deleting old entries.
    if (this.#cache.size > this.maxEntries) {
      let sortedList = Array.from(this.#cache.entries()).sort((e) => e[1].accessed);
      let deleteList = sortedList.slice(0, 20);

      deleteList.forEach((val) => {
        this.#cache.delete(val[0]);
      });
    }

    val.accessed = Date.now();

    return val;
  }

  set(key: string, val: any) {
    this.#cache.set(key, { accessed: Date.now(), value: val });
  }
}
