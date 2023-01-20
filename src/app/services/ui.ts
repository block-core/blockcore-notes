import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { NostrEventDocument, NostrProfileDocument } from './interfaces';
import { ProfileService } from './profile';

@Injectable({
  providedIn: 'root',
})
export class UIService {
  constructor() {}

  #pubkey: string | undefined = undefined;

  get pubkey() {
    return this.#pubkey;
  }

  #pubkeyChanged: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.pubkey);

  get pubkey$(): Observable<string | undefined> {
    return this.#pubkeyChanged.asObservable();
  }

  setPubKey(pubkey: string | undefined) {
    this.#pubkey = pubkey;

    // Reset the profile and events when pubkey is changed.
    this.#profile = undefined;
    this.events = [];

    this.#eventsChanged.next(this.events);
    this.#profileChanged.next(this.#profile);
    this.#pubkeyChanged.next(this.#pubkey);
  }

  setProfile(profile: NostrProfileDocument | undefined) {
    const before = this.#profile
    this.#profile = profile;
    if (JSON.stringify(before) !== JSON.stringify(profile)) this.#profileChanged.next(this.#profile);
  }

  #profile: NostrProfileDocument | undefined = undefined;

  get profile() {
    return this.#profile;
  }

  #profileChanged: BehaviorSubject<NostrProfileDocument | undefined> = new BehaviorSubject<NostrProfileDocument | undefined>(this.profile);

  get profile$(): Observable<NostrProfileDocument | undefined> {
    return this.#profileChanged.asObservable();
  }

  events: NostrEventDocument[] = [];

  #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);

  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged.asObservable().pipe(map((data) => data.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))));
  }

  putEvent(event: NostrEventDocument) {
    // It might happen that async events are triggering this method after user have selected another
    // profile to watch, so we must ignore those events to avoid UI-glitches.
    if (event.pubkey != this.pubkey) {
      return;
    }

    const existingIndex = this.events.findIndex((e) => e.id == event.id);

    if (existingIndex > -1) {
      this.events[existingIndex] = event;
    } else {
      this.events.unshift(event);

      // Attempting to only trigger events changed if there is an actual change in the content.
      this.#eventsChanged.next(this.events);
    }
  }

  putEvents(events: NostrEventDocument[]) {
    this.events = events;
    this.#eventsChanged.next(this.events);
  }

  clearEvents() {
    this.events = [];
    this.#eventsChanged.next(this.events);
  }

  //   get profile$(): Observable<NostrProfileDocument | undefined> {
  //     return this.#pubkeyChanged.pipe((pubkey) => {
  //       if (!pubkey) {
  //         return null;
  //       }

  //       return this.profileService.getProfile(pubkey);
  //     });
  //   }
}
