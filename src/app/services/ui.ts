import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Kind } from 'nostr-tools';
import { BehaviorSubject, map, Observable, filter, flatMap, mergeMap, concatMap, tap, take, single } from 'rxjs';
import { EventService } from './event';
import { NostrEventDocument, NostrProfileDocument, NotificationModel } from './interfaces';
import { ProfileService } from './profile';

@Injectable({
  providedIn: 'root',
})
/** The orchestrator for UI that holds data to be rendered in different views at any given time. */
export class UIService {
  constructor(private eventService: EventService) {}

  #unreadNotificationsChanged: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  get unreadNotifications$(): Observable<number> {
    return this.#unreadNotificationsChanged.asObservable();
  }

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
    return this.#eventsChanged.asObservable();
    // return this.#eventsChanged.asObservable().pipe(map((data) => data.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))));
  }

  children(parentId: string): NostrEventDocument[] {
    // if (this.events.length > 4) {
    //   console.log('PARENT ID:', parentId);
    //   console.log(this.events);
    // }

    const filtered = this.events.filter((d) => d.parentEventId === parentId);

    // if (filtered.length > 0) {
    //   console.log('filtered:', filtered);
    // }

    // console.log(parentId);
    // console.log(this.events);

    return filtered;
  }

  children$(parentId: string): Observable<NostrEventDocument[]> {
    // const filtered = this.events$.pipe(filter((item, index) => sorted.findIndex((e) => e.pubkey == item.pubkey) === index));
    return this.events$.pipe(
      tap((data) => {
        return data.filter((d) => d.replyEventId === parentId);
      })
    );

    // return this.events$.pipe(filter((data) => data.filter((d) => d.replyEventId === parentId) ));
    // this.events$.pipe(
    //   compactMap ((data) => data data.epics) // [{id: 1}, {id: 4}, {id: 3}, ..., {id: N}]
    // .filter((epic) => epic.id === id) // checks {id: 1}, then {id: 2}, etc
    // .subscribe((result) => ...); // do something epic!!!

    // // return this.events$.pipe(filter((e) => e.));
    // // return this.#eventsChanged.asObservable().pipe(map((data) => data.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))));
  }

  #notifications: NotificationModel[] = [];

  get notifications() {
    return this.#notifications;
  }

  putNotifications(notifications: NotificationModel[]) {
    notifications = notifications.sort((a, b) => {
      return a.created < b.created ? 1 : -1;
    });

    this.#notifications = notifications;

    const unread = this.#notifications.filter((n) => !n.seen).length;
    this.#unreadNotificationsChanged.next(unread);
  }

  putNotification(notification: NotificationModel) {
    const index = this.#notifications.findIndex((n) => n.id == notification.id);

    if (index == -1) {
      this.#notifications.unshift(notification);

      this.#notifications = this.#notifications.sort((a, b) => {
        return a.created < b.created ? 1 : -1;
      });
    } else {
      this.#notifications[index] = notification;
    }

    const unread = this.#notifications.filter((n) => !n.seen).length;
    this.#unreadNotificationsChanged.next(unread);
  }

  putEvent(event: NostrEventDocument) {
    // It might happen that async events are triggering this method after user have selected another
    // profile to watch, so we must ignore those events to avoid UI-glitches.
    // if (event.pubkey != this.pubkey) {
    //   return;
    // }

    if (event.kind == Kind.Text) {
      const existingIndex = this.events.findIndex((e) => e.id == event.id);

      event = this.calculateFields(event);

      if (existingIndex > -1) {
        this.events[existingIndex] = event;
      } else {
        this.events.unshift(event);

        if (this.pubkey) {
          this.events = this.events.sort((a, b) => {
            return a.created_at < b.created_at ? 1 : -1;
          });
        } else {
          this.events = this.events.sort((a, b) => {
            return a.created_at < b.created_at ? -1 : 1;
          });
        }

        // Attempting to only trigger events changed if there is an actual change in the content.
        this.#eventsChanged.next(this.events);
      }
    }
  }

  putEvents(events: NostrEventDocument[]) {
    // For now, filter out only text.
    this.events = events.filter((e) => e.kind == Kind.Text);

    this.events = this.events.map((e) => this.calculateFields(e));

    if (this.pubkey) {
      this.events = this.events.sort((a, b) => {
        return a.created_at < b.created_at ? 1 : -1;
      });
    } else {
      this.events = this.events.sort((a, b) => {
        return a.created_at < b.created_at ? -1 : 1;
      });
    }

    this.#eventsChanged.next(this.events);
  }

  clear() {
    this.#eventId = undefined;
    this.#event = undefined;

    this.parentEventId = undefined;
    this.#parentEvent = undefined;

    this.events = [];

    this.#pubkey = undefined;
    this.#profile = undefined;

    this.#eventChanged.next(this.#event);
    this.#eventsChanged.next(this.events);
    this.#profileChanged.next(this.#profile);
  }

  clearEvents() {
    this.events = [];
    this.#eventsChanged.next(this.events);
  }

  // #parentEventId: string | undefined = undefined;

  // get parentEventId() {
  //   return this.#parentEventId;
  // }

  // #parentEventId: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.parentEventId);

  // get parentEventId$(): Observable<string | undefined> {
  //   return this.#parentEventId.asObservable();
  // }

  // #parentEventId: string | undefined = undefined;

  // get parentEventId() {
  //   return this.#parentEventId;
  // }

  // #parentEventIdChanged: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.parentEventId);

  // get parentEventId$(): Observable<string | undefined> {
  //   return this.#parentEventIdChanged.asObservable();
  // }

  parentEventId?: string;

  #parentEvent?: NostrEventDocument;

  #parentEventChanged: BehaviorSubject<NostrEventDocument | undefined> = new BehaviorSubject<NostrEventDocument | undefined>(this.#parentEvent);

  get parentEvent$(): Observable<NostrEventDocument | undefined> {
    return this.#parentEventChanged.asObservable();
  }

  #event?: NostrEventDocument;

  #eventChanged: BehaviorSubject<NostrEventDocument | undefined> = new BehaviorSubject<NostrEventDocument | undefined>(this.#event);

  get event$(): Observable<NostrEventDocument | undefined> {
    return this.#eventChanged.asObservable();
  }

  // selectedEventId?: string;

  calculateFields(event: NostrEventDocument) {
    const eTags = event.tags.filter((t) => t[0] === 'e');

    for (let i = 0; i < eTags.length; i++) {
      const tag = eTags[i];

      // If more than 4, we likely have "root" or "reply"
      if (tag.length > 3) {
        if (tag[3] == 'root') {
          event.rootEventId = tag[1];
        }

        if (tag[3] == 'reply') {
          event.replyEventId = tag[1];
        }
      }
    }

    if (eTags.length > 0) {
      event.rootEventId = eTags[0][1];
      event.parentEventId = eTags[eTags.length - 1][1];
    }

    if (eTags.length < 2) {
    } else {
      event.replyEventId = eTags[1][1];
    }

    return event;
  }

  setEvent(event: NostrEventDocument | undefined) {
    const beforeKey = this.#event?.id;

    // Change the active event ID without triggering the changed event.
    this.#eventId = event?.id;

    if (event) {
      this.#event = this.calculateFields(event);
    } else {
      this.#event = event;
    }

    if (this.#event?.id != beforeKey) {
      this.#eventChanged.next(this.#event);

      this.parentEventId = this.#event?.parentEventId;
      this.#parentEventChanged.next(undefined);

      // Set the parent event and start retrieving it.
      // this.#parentEventId = this.#event?.parentEventId;
      // this.#parentEventChanged.next(this.parentEventId);
    }
  }

  setParentEvent(event: NostrEventDocument | undefined) {
    const beforeKey = this.#parentEvent?.id;

    if (event) {
      this.#parentEvent = this.calculateFields(event);
      this.parentEventId = this.#parentEvent.id;
    } else {
      this.parentEventId = undefined;
    }

    if (this.#parentEvent?.id != beforeKey) {
      this.#parentEventChanged.next(this.#parentEvent);
    }
  }
}
