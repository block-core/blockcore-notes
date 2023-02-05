import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map, Observable, filter } from 'rxjs';
import { NostrEventDocument, NostrProfileDocument } from './interfaces';
import { ProfileService } from './profile';

@Injectable({
  providedIn: 'root',
})
/** The orchestrator for UI that holds data to be rendered in different views at any given time. */
export class UIService {
  constructor() {}

  #eventId: string | undefined = undefined;

  get eventId() {
    return this.#eventId;
  }

  #eventIdChanged: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.eventId);

  get eventId$(): Observable<string | undefined> {
    return this.#eventIdChanged.asObservable();
  }

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
    const before = this.#profile;
    this.#profile = profile;

    // Only trigger this event if the pubkey is different. The profile
    // itself might be updated with following list so we can't validate against the object themselves.
    if (before?.pubkey != profile?.pubkey) {
      this.#profileChanged.next(this.#profile);
    }
  }

  /** Changes the active event ID. This will trigger subscribers, which will change the actual event. */
  setEventId(id: string | undefined) {
    debugger;
    console.log('setEventId:', id);

    this.#eventId = id;
    this.#eventIdChanged.next(this.#eventId);

    this.#event = undefined;
    this.#eventChanged.next(this.#event);

    this.events = [];
    this.#eventsChanged.next(this.events);
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
    // if (event.pubkey != this.pubkey) {
    //   return;
    // }

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

  #event?: NostrEventDocument;

  #eventChanged: BehaviorSubject<NostrEventDocument | undefined> = new BehaviorSubject<NostrEventDocument | undefined>(this.#event);

  get event$(): Observable<NostrEventDocument | undefined> {
    return this.#eventChanged.asObservable();
  }

  // selectedEventId?: string;

  setEvent(event: NostrEventDocument | undefined) {
    const beforeKey = this.#event?.id;

    // Change the active event ID without triggering the changed event.
    this.#eventId = event?.id;
    this.#event = event;

    if (this.#event?.id != beforeKey) {
      this.#eventChanged.next(this.#event);
    }
  }
}
