import { Injectable } from '@angular/core';
import { NostrEvent, NostrProfile, NostrEventDocument, NostrProfileDocument, Circle, Person } from './interfaces';
import * as sanitizeHtml from 'sanitize-html';
import { SettingsService } from './settings.service';
import { Observable, of } from 'rxjs';
import { relayInit } from 'nostr-tools';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Requirements:
  // The public feed should be 200 items in-memory and filtered down to 100 visible at any time.
  // The follow feed

  /** We keep circles in-memory at all times */
  #circles: Circle[] = [];

  /** All people that user is following. We don't keep this in memory at all times, but populated upon request. */
  #people: Person[] = [];

  circles: Observable<Circle[]>;
  people: Observable<Person[]>;
  #public: NostrEventDocument[] = [];

  /**  */
  // #posts: NostrEventDocument[] = [];

  /** Returns the last 100 entries of public feed. The internal data holds 200 entries,
   * so when filter/options is turned off, the result is taken from the 200 entries. */
  public$: Observable<NostrEventDocument[]>;

  constructor(private storage: StorageService, private profile: ProfileService) {
    this.circles = this.getCircles();
    this.people = this.getPeople();

    this.public$ = this.getPublic();
  }

  openRelay() {
    // const relay = relayInit('wss://relay.nostr.info');
    // this.relay = relayInit('wss://relay.damus.io');
    // this.relay.on('connect', () => {
    //   console.log(`connected to ${this.relay?.url}`);
    //   this.onConnected(this.relay);
    // });
    // this.relay.on('disconnect', () => {
    //   console.log(`DISCONNECTED! ${this.relay?.url}`);
    // });
    // this.relay.on('notice', () => {
    //   console.log(`NOTICE FROM ${this.relay?.url}`);
    // });
    // this.relay.connect();
  }

  getPublic(): Observable<NostrEventDocument[]> {
    return new Observable<NostrEventDocument[]>((observer) => {
      observer.next(this.#public);

      setTimeout(() => {
        // this.#public.push({ id: '', name: '', price: 899 });
        // observer.next(this.#public);
      }, 3000);
    });
  }

  getPeople(): Observable<Person[]> {
    return new Observable<Person[]>((observer) => {
      observer.next(this.#people);
    });
  }

  getCircles(): Observable<Circle[]> {
    return new Observable<Circle[]>((observer) => {
      observer.next(this.#circles);
    });
  }
}
