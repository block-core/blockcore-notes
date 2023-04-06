import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Kind } from 'nostr-tools';
import { BehaviorSubject, map, Observable, filter, flatMap, mergeMap, concatMap, tap, take, single, takeWhile, from, of } from 'rxjs';
import { EventService } from './event';
import { EmojiEnum, LoadMoreOptions, NostrEvent, NostrEventDocument, NostrProfileDocument, NotificationModel, ThreadEntry } from './interfaces';
import { OptionsService } from './options';
import { ProfileService } from './profile';
import { ZapService } from './zap.service';

@Injectable({
  providedIn: 'root',
})
/** The orchestrator for UI that holds data to be rendered in different views at any given time. */
export class UIService {
  constructor(private eventService: EventService, private options: OptionsService, private zapService: ZapService) {}

  #lists = {
    feedEvents: [] as NostrEventDocument[],
    feedEventsView: [] as NostrEventDocument[],
    threadEvents: [] as NostrEventDocument[],
    followingEvents: [] as NostrEventDocument[],
    followingEventsView: [] as NostrEventDocument[],
    rootEvents: [] as NostrEventDocument[],
    replyEvents: [] as NostrEventDocument[],
    rootEventsView: [] as NostrEventDocument[],
    replyEventsView: [] as NostrEventDocument[],
    reactions: new Map<string, ThreadEntry>(),
  };

  viewCounts = {
    feedEventsViewCount: 5,
    feedEventsViewCountExhausted: false,
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

  setPubKey(pubkey: string | undefined, reset = true) {
    this.#pubkey = pubkey;

    if (reset) {
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
  }

  setProfile(profile: NostrProfileDocument | undefined, forceChanged = false) {
    const before = this.#profile;
    this.#profile = profile;

    // Only trigger this event if the pubkey is different. The profile
    // itself might be updated with following list so we can't validate against the object themselves.
    if (forceChanged || before?.pubkey != profile?.pubkey) {
      this.#profileChanged.next(this.#profile);
    }
  }

  /** Changes the active event ID. This will trigger subscribers, which will change the actual event. */
  setEventId(id: string | undefined) {
    console.log('setEventId:', id);

    this.#eventId = id;
    this.#event = undefined;
    this.events = [];

    this.#eventIdChanged.next(this.#eventId);
    this.#eventChanged.next(this.#event);
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

  #reactionsChanged: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);

  get reactions$(): Observable<string | undefined> {
    return this.#reactionsChanged.asObservable();
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

  #loadMore: BehaviorSubject<LoadMoreOptions | undefined> = new BehaviorSubject<LoadMoreOptions | undefined>(undefined);

  get loadMore$(): Observable<LoadMoreOptions | undefined> {
    return this.#loadMore.asObservable();
  }

  previousProfileSinceValue: number = 0;
  previousFeedSinceValue: number = 0;
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
      this.#loadMore.next({ until: date, type: 'profile' });
    } else {
      // Only when both there is nothing more to load and view events has scrolled to bottom, we'll show exhausted.
      // this.checkExhausted();
    }
  }

  triggerLoadMoreFeedEvents() {
    const date = this.#lists.feedEvents[this.#lists.feedEvents.length - 1].created_at;

    // If there is nothing new, don't trigger:
    if (date > this.previousFeedSinceValue) {
      this.previousFeedSinceValue = date;
      this.#loadMore.next({ circle: this.#circle, until: date, type: 'feed' });
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

    if (this.viewCounts.feedEventsViewCountExhausted) {
      // this.triggerLoadMoreFeedEvents();
    }
  }

  updateFeedEventsView(start: number, count: number) {
    this.viewCounts.feedEventsViewCount = count;
    this.#lists.feedEventsView = this.#lists.feedEvents.slice(start, count);

    this.#feedEventsView.next(this.#lists.feedEventsView);

    // If the amount of events is still less than count, don't trigger more loading.
    if (this.#lists.feedEvents.length >= count) {
      this.viewCounts.feedEventsViewCountExhausted = count >= this.#lists.feedEvents.length;
      if (this.#lists.feedEvents.length > 0 && this.viewCounts.feedEventsViewCountExhausted) {
        this.triggerLoadMoreFeedEvents();
      }
    }
  }

  updateRootEventsView(start: number, count: number) {
    this.viewCounts.rootEventsViewCount = count;
    this.#lists.rootEventsView = this.#lists.rootEvents.slice(start, count);
    this.#rootEventsView.next(this.#lists.rootEventsView);

    // If the amount of events is still less than count, don't trigger more loading.
    if (this.#lists.rootEvents.length >= count) {
      this.viewCounts.rootEventsViewCountExhausted = count >= this.#lists.rootEvents.length;
      if (this.#lists.rootEvents.length > 0 && this.viewCounts.rootEventsViewCountExhausted) {
        this.triggerLoadMoreProfileEvents();
      }
    }
  }

  updateReplyEventsView(start: number, count: number) {
    this.viewCounts.replyEventsViewCount = count;
    this.#lists.replyEventsView = this.#lists.replyEvents.slice(start, count);
    this.#replyEventsView.next(this.#lists.replyEventsView);

    // If the amount of events is still less than count, don't trigger more loading.
    if (this.#lists.replyEvents.length >= count) {
      this.viewCounts.replyEventsViewCountExhausted = count >= this.#lists.replyEvents.length;
      if (this.#lists.replyEvents.length > 0 && this.viewCounts.replyEventsViewCountExhausted) {
        this.triggerLoadMoreProfileEvents();
      }
    }
  }

  updateFollowingEventsView(start: number, count: number) {
    this.viewCounts.followingEventsViewCount = count;
    this.#lists.followingEventsView = this.#lists.followingEvents.slice(start, count);
    this.viewCounts.followingEventsViewExhausted = count >= this.#lists.followingEvents.length;
    this.#followingEventsView.next(this.#lists.followingEventsView);

    if (this.#lists.followingEvents.length > 0 && this.viewCounts.followingEventsViewExhausted) {
      // this.triggerLoadMore();
    }
  }

  sortAscending(a: NostrEventDocument, b: NostrEventDocument) {
    return a.created_at < b.created_at ? -1 : 1;
  }

  sortDescending(a: NostrEventDocument, b: NostrEventDocument) {
    return a.created_at < b.created_at ? 1 : -1;
  }

  #feedEvents: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.feedEvents);

  get feedEvents$(): Observable<NostrEventDocument[]> {
    return this.#feedEvents.asObservable();
  }

  #feedEventsView: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#lists.feedEventsView);

  get feedEventsView$(): Observable<NostrEventDocument[]> {
    return this.#feedEventsView.asObservable();
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

  putFeedEvent(event: NostrEventDocument) {
    if (event.kind == Kind.Text) {
      event = this.calculateFields(event);

      const index = this.#lists.feedEvents.findIndex((e) => e.id == event.id);
      if (index == -1) {
        this.#lists.feedEvents.push(event);
        this.#lists.feedEvents = this.#lists.feedEvents.sort(this.sortDescending);
        this.updateFeedEventsView(0, this.viewCounts.feedEventsViewCount);
      } else {
        this.#lists.feedEvents[index] = event;
      }
    }
  }

  putEvent(event: NostrEventDocument) {
    // It might happen that async events are triggering this method after user have selected another
    // profile to watch, so we must ignore those events to avoid UI-glitches.
    // if (event.pubkey != this.pubkey) {
    //   return;
    // }

    if (event.kind == Kind.Reaction) {
      if (!this.options.values.enableReactions) {
        return;
      }

      const eventId = this.eventService.lastETag(event);

      if (eventId) {
        const entry = this.getThreadEntry(eventId);

        // If we have already counted this reaction, skip.
        if (entry.reactionIds.includes(event.id!)) {
          return;
        }

        if (event.content == '' || event.content == '+') {
          if (!entry.reactions[EmojiEnum['❤️']]) {
            entry.reactions[EmojiEnum['❤️']] = 1;
          } else {
            entry.reactions[EmojiEnum['❤️']]++;
          }
        } else if (event.content == '-') {
          if (!entry.reactions[EmojiEnum['💔']]) {
            entry.reactions[EmojiEnum['💔']] = 1;
          } else {
            entry.reactions[EmojiEnum['💔']]++;
          }
        } else {
          if (!entry.reactions[event.content]) {
            entry.reactions[event.content] = 1;
          } else {
            entry.reactions[event.content]++;
          }
        }

        entry.reactionIds.push(event.id!);
        this.putThreadEntry(entry);
      }
    } else if ((event.kind as any) == 6) {
      const eventId = this.eventService.lastETag(event);

      if (eventId) {
        const entry = this.getThreadEntry(eventId);

        // If we have already counted this reaction, skip.
        if (entry.reactionIds.includes(event.id!)) {
          return;
        }

        entry.boosts++;
        entry.reactionIds.push(event.id!);
        this.putThreadEntry(entry);
      }
    } else if (event.kind == Kind.Text) {
      event = this.calculateFields(event);

      if (this.pubkey) {
        // Profile
        if (!event.parentEventId) {
          // Only allow events here that has correct pubkey. There might be events that
          // are received from relays when navigating in the UI.
          // This MIGHT be redudant...
          if (event.pubkey != this.pubkey) {
            debugger;
            console.log('EVENT BY OTHERS ON PROFILE:', event);
            return;
          }

          const index = this.#lists.rootEvents.findIndex((e) => e.id == event.id);
          if (index == -1) {
            this.#lists.rootEvents.push(event);
            this.#lists.rootEvents = this.#lists.rootEvents.sort(this.sortDescending);
            this.updateRootEventsView(0, this.viewCounts.rootEventsViewCount);
          } else {
            this.#lists.rootEvents[index] = event;
          }
        } else {
          // Only allow events here that has correct pubkey. There might be events that
          // are received from relays when navigating in the UI.
          // This MIGHT be redudant...
          if (event.pubkey != this.pubkey) {
            debugger;
            console.log('EVENT BY OTHERS ON PROFILE:', event);
            return;
          }

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
    } else if (event.kind == Kind.Zap) {
      if (!this.options.values.enableZapping) {
        return;
      }

      const eventId = this.eventService.lastETag(event);

      if (eventId) {
        const entry = this.getThreadEntry(eventId);

        if (entry.reactionIds.includes(event.id!)) {
          return;
        }

        entry.reactionIds.push(event.id!);
        const parsedZap = this.zapService.parseZap(event);
        entry.zaps != undefined ? entry.zaps.push(parsedZap) : (entry.zaps = [parsedZap]);

        this.putThreadEntry(entry);
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

  getThreadEntry(eventId: string) {
    let entry = this.#lists.reactions.get(eventId);

    if (!entry) {
      entry = {
        eventId: eventId,
        reactionIds: [],
        boosts: 0,
        reactions: {},
      };
    }

    return entry;
  }

  putThreadEntry(entry: ThreadEntry) {
    this.#lists.reactions.set(entry.eventId, entry);
    this.#reactionsChanged.next(entry.eventId);
  }

  // putReaction(id: string, entry: ThreadEntry) {
  //   // let entry = this.#lists.reactions.get(id);

  //   // if (!entry) {
  //   //   entry = {
  //   //     id: id,
  //   //     boosts: 0,
  //   //     reactions: {},
  //   //   };
  //   // }

  //   this.#lists.reactions.set(id, entry);
  // }

  clearViewPositions() {
    this.previousProfileSinceValue = 0;
    this.previousFeedSinceValue = 0;
  }

  clearLists() {
    this.#lists.feedEvents = [];
    this.#lists.feedEventsView = [];

    this.#lists.threadEvents = [];

    this.#lists.rootEvents = [];
    this.#lists.rootEventsView = [];

    this.#lists.replyEvents = [];
    this.#lists.replyEventsView = [];

    this.#lists.followingEvents = [];
    this.#lists.followingEventsView = [];

    this.#lists.reactions = new Map<string, ThreadEntry>();

    this.#notifications = [];
    this.#activityFeed = [];
    this.#unreadNotificationsChanged.next(0);

    this.#threadEvents.next(this.#lists.threadEvents);

    this.#feedEvents.next(this.#lists.feedEvents);
    this.#feedEventsView.next(this.#lists.feedEventsView);

    this.#rootEvents.next(this.#lists.rootEvents);
    this.#rootEventsView.next(this.#lists.rootEventsView);

    this.#replyEvents.next(this.#lists.replyEvents);
    this.#replyEventsView.next(this.#lists.replyEventsView);

    this.#followingEvents.next(this.#lists.followingEvents);
    this.#followingEventsView.next(this.#lists.followingEventsView);
  }

  clearAll() {
    this.clear();
    this.clearFeed();
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

  clearFeed() {
    this.#lists.feedEvents = [];
    this.#lists.feedEventsView = [];
    this.#feedEvents.next(this.#lists.feedEvents);
    this.#feedEventsView.next(this.#lists.feedEventsView);
    this.previousFeedSinceValue = 0;
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

  #circle?: number;

  #circleChanged: BehaviorSubject<number | undefined> = new BehaviorSubject<number | undefined>(this.#circle);

  get circle$(): Observable<number | undefined> {
    return this.#circleChanged.asObservable();
  }

  setFeedCircle(circle?: number) {
    this.#circle = circle;
    this.#circleChanged.next(this.#circle);
  }
}
