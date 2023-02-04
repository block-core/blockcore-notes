import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, DBSchema } from 'idb';
import { Circle, LabelModel, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument, StateDocument } from '../services/interfaces';

/** Make sure you read and learn: https://github.com/jakearchibald/idb */

export function now() {
  return Math.floor(Date.now() / 1000);
}

interface NotesDB extends DBSchema {
  state: {
    value: StateDocument;
    key: number;
  };
  contacts: {
    value: NostrEventDocument;
    key: string;
  };
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
    indexes: { pubkey: string; created: number; kind: string };
  };
  profiles: {
    value: NostrProfileDocument;
    key: string;
    indexes: { status: number };
  };
  labels: {
    value: LabelModel;
    key: number;
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
        db.createObjectStore('circles', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('state', { keyPath: 'id' });
        db.createObjectStore('contacts', { keyPath: 'pubkey' });
        db.createObjectStore('labels', { keyPath: 'id' });

        const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
        eventsStore.createIndex('pubkey', 'pubkey');
        eventsStore.createIndex('created', 'created_at');
        eventsStore.createIndex('kind', 'kind');

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

  async getState() {
    return this.db.get('state', 1);
  }

  async putState(value: StateDocument) {
    value.id = 1;
    value.modified = now();
    return this.db.put('state', value);
  }

  async getCircle(key: number) {
    return this.db.get('circles', key);
  }

  async getCircles() {
    return this.db.getAll('circles');
  }

  async putNote(value: NostrNoteDocument) {
    value.saved = now();
    return this.db.put('notes', value);
  }

  async deleteNote(key: string) {
    return this.db.delete('notes', key);
  }

  async putCircle(value: Circle) {
    value.modified = now();
    return this.db.put('circles', value);
  }

  async getContacts(key: string) {
    return this.db.get('contacts', key);
  }

  async putContacts(value: NostrEventDocument) {
    return this.db.put('contacts', value);
  }

  async deleteContacts(key: string) {
    return this.db.delete('contacts', key);
  }

  async getProfile(key: string) {
    return this.db.get('profiles', key);
  }

  async putProfile(value: NostrProfileDocument) {
    value.modified = now();
    return this.db.put('profiles', value);
  }

  async getProfilesByStatus(status: number) {
    return this.db.getAllFromIndex('profiles', 'status', status);
  }

  async getProfilesByStatusCount(status: number) {
    return this.db.countFromIndex('profiles', 'status', status);
  }

  async getEvent(key: string) {
    return this.db.get('events', key);
  }

  async putEvents(value: NostrEventDocument) {
    return this.db.put('events', value);
  }

  async getEventsByPubKey(pubkey: string, count?: number) {
    return this.db.getAllFromIndex('events', 'pubkey', pubkey, count);
  }

  async getEventsByCreated2(query?: IDBKeyRange, count?: number) {
    return this.db.getAllFromIndex('events', 'created', query, count);
  }

  async getEventsByCreated(count: number) {
    let cursor = await this.db.transaction('events').store.index('created').openCursor(undefined, 'prev');
    const items = [];
    let index = 0;

    while (cursor) {
      items.push(cursor.value);
      index++;

      if (index >= count) {
        break;
      }

      cursor = await cursor.continue();
    }

    return items;
  }

  async getEventsByCreatedAndKind(count: number, kind: number) {
    let cursor = await this.db.transaction('events').store.index('created').openCursor(undefined, 'prev');
    const items = [];
    let index = 0;

    while (cursor) {
      if (cursor.value.kind == kind) {
        items.push(cursor.value);
        index++;

        if (index >= count) {
          break;
        }
      }

      cursor = await cursor.continue();
    }

    return items;
  }

  async getRelay(key: string) {
    return this.db.get('relays', key);
  }

  async getRelays() {
    return this.db.getAll('relays');
  }

  async getNotes() {
    return this.db.getAll('notes');
  }

  async putRelay(value: NostrRelayDocument) {
    value.modified = now();
    return this.db.put('relays', value);
  }

  async deleteCircle(key: number) {
    return this.db.delete('circles', key);
  }

  async deleteProfile(key: string) {
    return this.db.delete('profiles', key);
  }

  async deleteRelay(key: string) {
    return this.db.delete('relays', key);
  }

  async deleteRelays() {
    return this.db.clear('relays');
  }

  async deleteNotes() {
    return this.db.clear('notes');
  }

  async delete() {
    await deleteDB(this.name, {
      blocked() {
        console.log('BLOCKED...');
      },
    });
  }

  async getLabel(key: number) {
    return this.db.get('labels', key);
  }

  async getLabels() {
    return this.db.getAll('labels');
  }

  async putLabel(value: LabelModel) {
    return this.db.put('labels', value);
  }

  async deleteLabel(key: number) {
    return this.db.delete('labels', key);
  }
}
