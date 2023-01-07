import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { NostrNoteDocument, NostrProfileDocument } from './interfaces';

export interface CircleItem {
  id: string;
  name: string;
}

export interface RelayItem {
  id?: number;
  url: string;
}

export interface EventItem {
  id?: number;
  pubkey: number;
  content: string;
}

export interface ProfileItem {
  pubkey: string;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService extends Dexie {
  relays!: Table<RelayItem, string>;
  events!: Table<EventItem, string>;
  notes!: Table<NostrNoteDocument, string>;
  profiles!: Table<NostrProfileDocument, string>;
  circles!: Table<CircleItem, number>;

  constructor() {
    super('blockcore');
    this.version(1).stores({
      relays: 'url',
      events: 'id',
      notes: 'id',
      profiles: 'pubkey,follow',
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
