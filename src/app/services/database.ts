import Dexie, { Table } from 'dexie';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfileDocument, NostrRelayDocument } from './interfaces';

export class DatabaseService extends Dexie {
  relays!: Table<NostrRelayDocument, string>;
  events!: Table<NostrEventDocument, string>;
  notes!: Table<NostrNoteDocument, string>;
  profiles!: Table<NostrProfileDocument, string>;
  circles!: Table<Circle, number>;

  constructor(name: string) {
    super(name);

    this.version(2).stores({
      relays: 'url',
      events: 'id,pubkey',
      notes: 'id',
      profiles: 'pubkey,status',
      circles: '++id',
    });
    this.on('populate', () => this.populate());
  }

  async populate() {
    // const todoListId = await this.relays.add({
    //   url: 'To Do Today',
    // });
    // await this.events.bulkAdd([
    //   {
    //     todoListId,
    //     title: 'Feed the birds',
    //   },
    //   {
    //     todoListId,
    //     title: 'Watch a movie',
    //   },
    //   {
    //     todoListId,
    //     title: 'Have some sleep',
    //   },
    // ]);
  }
}
