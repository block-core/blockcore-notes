import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Kind } from 'nostr-tools';
import { BehaviorSubject, map, Observable, filter, flatMap, mergeMap, concatMap, tap, take, single, takeWhile, from, of } from 'rxjs';
import { EventService } from './event';
import { NostrEventDocument, NostrProfileDocument, NotificationModel } from './interfaces';
import { ProfileService } from './profile';

@Injectable({
  providedIn: 'root',
})
/** The orchestrator for UI that holds data to be rendered in different views at any given time. */
export class UIService {
  constructor(private eventService: EventService) {}

  #lists = {
    threadEvents: [] as NostrEventDocument[],
    followingEvents: [] as NostrEventDocument[],
    followingEventsView: [] as NostrEventDocument[],
    rootEvents: [] as NostrEventDocument[],
    replyEvents: [] as NostrEventDocument[],
    rootEventsView: [] as NostrEventDocument[],
    replyEventsView: [] as NostrEventDocument[],
  };

  viewCounts = {
    followingEventsViewCount: 5,
    followingEventsViewExhausted: false,
    rootEventsViewCount: 5,
    rootEventsViewCountExhausted: false,
    replyEventsViewCount: 5,
    replyEventsViewCountExhausted: false,
  };

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
    this.viewEvents = [];
    // this.previousSinceValue = 0;
    this.previousProfileSinceValue = 0;
    this.exhausted = false;

    this.clearLists();

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

  viewEvents: NostrEventDocument[] = [];

  #viewEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.viewEvents);

  get viewEvents$(): Observable<NostrEventDocument[]> {
    return this.#viewEventsChanged.asObservable();
  }

  viewReplyEvents: NostrEventDocument[] = [];

  #viewReplyEventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.viewReplyEvents);

  get viewReplyEvents$(): Observable<NostrEventDocument[]> {
    return this.#viewReplyEventsChanged.asObservable();
  }

  events: NostrEventDocument[] = [];

  #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);

  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged.asObservable();
    // return this.#eventsChanged.asObservable().pipe(map((data) => data.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))));
  }

  #loadMore: BehaviorSubject<number | undefined> = new BehaviorSubject<number | undefined>(0);

  get loadMore$(): Observable<number | undefined> {
    return this.#loadMore.asObservable();
  }

  previousProfileSinceValue: number = 0;
  exhausted = false;

  triggerLoadMoreProfileEvents() {
    let date1 = 0;
    let date2 = 0;

    if (this.#lists.rootEvents.length > 0) {
      date1 = this.#lists.rootEvents[this.#lists.rootEvents.length - 1].created_at;
    }

    if (this.#lists.replyEvents.length > 0) {
      date2 = this.#lists.replyEvents[this.#lists.replyEvents.length - 1].created_at;
    }

    let date = date1 > date2 ? date1 : date2;

    // If there is nothing new, don't trigger:
    if (date > this.previousProfileSinceValue) {
      this.previousProfileSinceValue = date;

      // TODO: We should NOT do this until we have actually exhausted the current subscription which might
      // be streaming in events...
      // this.#loadMore.next(date);
    } else {
      // Only when both there is nothing more to load and view events has scrolled to bottom, we'll show exhausted.
      // this.checkExhausted();
    }
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

  #activityFeed: NotificationModel[] = [];

  get activityFeed$(): Observable<NotificationModel[]> {
    return of(this.#activityFeed);
  }

  putNotifications(notifications: NotificationModel[]) {
    notifications = notifications.sort((a, b) => {
      return a.created < b.created ? 1 : -1;
    });

    this.#notifications = notifications;
    this.#activityFeed = this.#notifications.slice(0, 5);

    this.triggerUnreadNotifications();
  }

  triggerUnreadNotifications() {
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

    this.#activityFeed = this.#notifications.slice(0, 5);

    this.triggerUnreadNotifications();
  }

  viewEventsStart = 0;
  viewEventsCount = 5;

  /** The view events must be completely sliced each time because we can receive events in any created order and it will be re-sorted. */
  updateViewEvents(count: number) {
    this.viewEventsCount = count;
    this.viewEvents = this.events.slice(this.viewEventsStart, this.viewEventsCount);
    this.#viewEventsChanged.next(this.viewEvents);

    // If there already loaded some events and the viewEvents and events is same amount, then
    // it's time to ask relays for even older data.
    if (this.events.length == this.viewEvents.length) {
      // this.triggerLoadMore();
    }
  }

  updateRootEventsView(start: number, count: number) {
    this.viewCounts.rootEventsViewCount = count;
    this.#lists.rootEventsView = this.#lists.rootEvents.slice(start, count);
    this.viewCounts.rootEventsViewCountExhausted = count >= this.#lists.rootEvents.length;
    this.#rootEventsView.next(this.#lists.rootEventsView);

    if (this.viewCounts.rootEventsViewCountExhausted) {
      this.triggerLoadMoreProfileEvents();
    }
  }

  updateReplyEventsView(start: number, count: number) {
    this.viewCounts.replyEventsViewCount = count;
    this.#lists.replyEventsView = this.#lists.replyEvents.slice(start, count);
    this.viewCounts.replyEventsViewCountExhausted = count >= this.#lists.replyEvents.length;
    this.#replyEventsView.next(this.#lists.replyEventsView);

    if (this.viewCounts.rootEventsViewCountExhausted) {
      this.triggerLoadMoreProfileEvents();
    }
  }

  updateFollowingEventsView(start: number, count: number) {
    this.viewCounts.followingEventsViewCount = count;
    this.#lists.followingEventsView = this.#lists.followingEvents.slice(start, count);
    this.viewCounts.followingEventsViewExhausted = count >= this.#lists.followingEvents.length;
    this.#followingEventsView.next(this.#lists.followingEventsView);

    if (this.viewCounts.rootEventsViewCountExhausted) {
      // this.triggerLoadMore();
    }
  }

  sortAscending(a: NostrEventDocument, b: NostrEventDocument) {
    return a.created_at < b.created_at ? -1 : 1;
  }

  sortDescending(a: NostrEventDocument, b: NostrEventDocument) {
    return a.created_at < b.created_at ? 1 : -1;
  }

  #rootEvents: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.rootEvents);

  get rootEvents$(): Observable<NostrEventDocument[]> {
    return this.#rootEvents.asObservable();
  }

  #rootEventsView: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.rootEventsView);

  get rootEventsView$(): Observable<NostrEventDocument[]> {
    return this.#rootEventsView.asObservable();
  }

  #replyEvents: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.replyEvents);

  get replyEvents$(): Observable<NostrEventDocument[]> {
    return this.#replyEvents.asObservable();
  }

  #replyEventsView: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.replyEventsView);

  get replyEventsView$(): Observable<NostrEventDocument[]> {
    return this.#replyEventsView.asObservable();
  }

  #threadEvents: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.threadEvents);

  get threadEvents$(): Observable<NostrEventDocument[]> {
    return this.#threadEvents.asObservable();
  }

  #followingEvents: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.followingEvents);

  get followingEvents$(): Observable<NostrEventDocument[]> {
    return this.#followingEvents.asObservable();
  }

  #followingEventsView: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.followingEventsView);

  get followingEventsView$(): Observable<NostrEventDocument[]> {
    return this.#followingEventsView.asObservable();
  }

  putEvent(event: NostrEventDocument) {
    // It might happen that async events are triggering this method after user have selected another
    // profile to watch, so we must ignore those events to avoid UI-glitches.
    // if (event.pubkey != this.pubkey) {
    //   return;
    // }

    if (event.kind == Kind.Text) {
      event = this.calculateFields(event);

      if (this.pubkey) {
        // Profile
        if (!event.rootEventId) {
          const index = this.#lists.rootEvents.findIndex((e) => e.id == event.id);
          if (index == -1) {
            this.#lists.rootEvents.push(event);
            this.#lists.rootEvents = this.#lists.rootEvents.sort(this.sortDescending);
            this.updateRootEventsView(0, this.viewCounts.rootEventsViewCount);
          } else {
            this.#lists.rootEvents[index] = event;
          }
        } else {
          const index = this.#lists.replyEvents.findIndex((e) => e.id == event.id);
          if (index == -1) {
            this.#lists.replyEvents.push(event);
            this.#lists.replyEvents = this.#lists.replyEvents.sort(this.sortDescending);
            this.updateReplyEventsView(0, this.viewCounts.replyEventsViewCount);
          } else {
            this.#lists.replyEvents[index] = event;
          }
        }
      } else if (this.eventId) {
        // Thread
        const index = this.#lists.threadEvents.findIndex((e) => e.id == event.id);
        if (index == -1) {
          this.#lists.threadEvents.push(event);
          this.#lists.threadEvents = this.#lists.threadEvents.sort(this.sortDescending);
        } else {
          this.#lists.threadEvents[index] = event;
        }
      } else {
        // Following
        const index = this.#lists.followingEvents.findIndex((e) => e.id == event.id);
        if (index == -1) {
          this.#lists.followingEvents.push(event);
          this.#lists.followingEvents = this.#lists.followingEvents.sort(this.sortDescending);
          this.updateFollowingEventsView(0, this.viewCounts.followingEventsViewCount);
        } else {
          this.#lists.followingEvents[index] = event;
        }
      }

      const existingIndex = this.events.findIndex((e) => e.id == event.id);

      if (existingIndex > -1) {
        this.events[existingIndex] = event;
      } else {
        if (!event.rootEventId) {
        } else {
        }

        this.events.unshift(event);

        if (this.pubkey) {
          this.events = this.events.sort((a, b) => {
            return a.created_at < b.created_at ? 1 : -1;
          });

          // Update the view events array:
          this.viewEvents = this.events.slice(this.viewEventsStart, this.viewEventsCount);
          this.viewEvents = this.events.slice(this.viewEventsStart, this.viewEventsCount);

          // this.viewEvents = this.viewEvents.sort((a, b) => {
          //   return a.created_at < b.created_at ? 1 : -1;
          // });

          // this.viewReplyEvents = this.viewReplyEvents.sort((a, b) => {
          //   return a.created_at < b.created_at ? 1 : -1;
          // });

          this.checkExhausted();
        } else {
          this.events = this.events.sort((a, b) => {
            return a.created_at < b.created_at ? -1 : 1;
          });

          // this.viewEvents = this.viewEvents.sort((a, b) => {
          //   return a.created_at < b.created_at ? -1 : 1;
          // });

          // this.viewReplyEvents = this.viewReplyEvents.sort((a, b) => {
          //   return a.created_at < b.created_at ? -1 : 1;
          // });
        }

        // Attempting to only trigger events changed if there is an actual change in the content.
        this.#eventsChanged.next(this.events);
        this.#viewEventsChanged.next(this.viewEvents);
        this.#viewReplyEventsChanged.next(this.viewReplyEvents);
      }
    }
  }

  checkExhausted() {
    // Only when both there is nothing more to load and view events has scrolled to bottom, we'll show exhausted.
    if (this.viewEvents.length == this.events.length) {
      this.exhausted = true;
    } else {
      this.exhausted = false;
    }
  }

  putEvents(events: NostrEventDocument[]) {
    // For now, filter out only text.
    this.events = events.filter((e) => e.kind == Kind.Text);
    this.viewEvents = [];

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
    this.#viewEventsChanged.next(this.viewEvents);
  }

  clearLists() {
    this.#lists.threadEvents = [];
    this.#lists.followingEvents = [];
    this.#lists.rootEvents = [];
    this.#lists.replyEvents = [];

    this.#lists.rootEventsView = [];
    this.#lists.replyEventsView = [];
    this.#lists.followingEventsView = [];
  }

  clear() {
    this.clearLists();

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

    if (event.rootEventId == event.parentEventId) {
      event.rootEventId = undefined;
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
