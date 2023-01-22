import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, DBSchema } from 'idb';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument } from '../services/interfaces';

/** Make sure you read and learn: https://github.com/jakearchibald/idb */

interface NotesDB extends DBSchema {
  relays: {
    value: NostrRelayDocument;
    key: string;
  };
  circles: {
    value: Circle;
    key: number;
  };
  notes: {
    value: NostrNoteDocument;
    key: string;
  };
  events: {
    value: NostrEventDocument;
    key: string;
    indexes: { pubkey: string; created: number };
  };
  profiles: {
    value: NostrProfileDocument;
    key: string;
    indexes: { status: number };
  };
}

export class Storage {
  public db!: IDBPDatabase<NotesDB>;

  constructor(private name: string, private version: number) {}

  async open() {
    this.db = await openDB<NotesDB>(this.name, this.version, {
      upgrade(db, oldVersion, newVersion, transaction, event) {
        db.createObjectStore('relays', { keyPath: 'url' });
        db.createObjectStore('notes', { keyPath: 'id' });
        db.createObjectStore('circles', { keyPath: 'id' });

        const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
        eventsStore.createIndex('pubkey', 'pubkey');
        eventsStore.createIndex('created', 'created_at');

        const profilesStore = db.createObjectStore('profiles', { keyPath: 'pubkey' });
        profilesStore.createIndex('status', 'status');
      },
      blocked(currentVersion, blockedVersion, event) {
        // …
      },
      blocking(currentVersion, blockedVersion, event) {
        // …
      },
      terminated() {
        // …
      },
    });
  }

  close() {
    this.db.close();
  }

  getCircle(key: number) {
    return this.db.get('circles', key);
  }

  putCircle(value: Circle) {
    return this.db.put('circles', value);
  }

  getProfile(key: string) {
    return this.db.get('profiles', key);
  }

  putProfile(value: NostrProfileDocument) {
    return this.db.put('profiles', value);
  }

  getProfilesByStatus(status: number) {
    return this.db.getAllFromIndex('profiles', 'status', status);
  }

  getEvent(key: string) {
    return this.db.get('events', key);
  }

  putEvents(value: NostrEventDocument) {
    return this.db.put('events', value);
  }

  getEventsByPubKey(pubkey: string, count?: number) {
    return this.db.getAllFromIndex('events', 'pubkey', pubkey, count);
  }

  getEventsByCreated(pubkey: string, query: IDBKeyRange, count?: number) {
    return this.db.getAllFromIndex('events', 'created', query, count);
  }

  getRelay(key: string) {
    return this.db.get('relays', key);
  }

  putRelay(value: NostrRelayDocument) {
    return this.db.put('relays', value);
  }

  async delete() {
    await deleteDB(this.name, {
      blocked() {
        // …
      },
    });
  }
}
