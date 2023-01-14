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
    this.#pubkeyChanged.next(this.#pubkey);
  }

  setProfile(profile: NostrProfileDocument | undefined) {
    this.#profile = profile;
    this.#profileChanged.next(this.#profile);
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
    const existingIndex = this.events.findIndex((e) => e.id == event.id);

    if (existingIndex > -1) {
      this.events[existingIndex] = event;
    } else {
      this.events.unshift(event);
    }

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
