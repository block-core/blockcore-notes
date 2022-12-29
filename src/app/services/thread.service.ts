import { Injectable } from '@angular/core';
import { NostrEvent, NostrProfile, NostrEventDocument, NostrProfileDocument, Circle, Person, NostrSubscription } from './interfaces';
import * as sanitizeHtml from 'sanitize-html';
import { SettingsService } from './settings.service';
import { Observable, of, BehaviorSubject, map, combineLatest, single, ReplaySubject, mergeMap } from 'rxjs';
import { Relay, relayInit, Sub } from 'nostr-tools';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { CirclesService } from './circles.service';
import * as moment from 'moment';
import { EventService } from './event.service';
import { DataValidation } from './data-validation.service';
import { OptionsService } from './options.service';
import { RelayService } from './relay.service';
import { RelayStorageService } from './relay.storage.service';
import { FeedService } from './feed.service';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  #event: NostrEventDocument | null = null;
  #eventChanged: BehaviorSubject<NostrEventDocument | null> = new BehaviorSubject<NostrEventDocument | null>(this.#event);
  event$ = this.#eventChanged.asObservable();

  #root: NostrEventDocument | null = null;
  #rootChanged: BehaviorSubject<NostrEventDocument | null> = new BehaviorSubject<NostrEventDocument | null>(this.#root);
  root$ = this.#rootChanged.asObservable();

  #events: NostrEventDocument[] = [];
  #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#events);

  // #beforeChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#events);
  // before$ = this.#beforeChanged.asObservable();

  // #afterChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.#events);
  // after$ = this.#afterChanged.asObservable();

  get before$(): Observable<NostrEventDocument[]> {
    return (
      this.#eventsChanged
        .asObservable()
        .pipe(
          map((data) => {
            data.sort((a, b) => {
              return a.created_at > b.created_at ? -1 : 1;
            });

            return data;
          })
        )
        .pipe(
          map((data) =>
            data.filter((events) => {
              // console.log(this.#event);
              const eTags = this.eventService.eTags(this.#event);

              // Skip all replies that are directly on root.
              if (eTags.length < 2) {
                return false;
              }

              const replyTag = this.eventService.replyEventId(this.#event);

              // console.log('REPLAY TAG ON SELECTED EVENT:', replyTag);
              // console.log('EVENTS ID:', events.id);

              // TODO: Doesn't work.
              if (replyTag === events.id) {
                return true;
              } else {
                return false;
              }
            })
          )
        )
        // Don't render the event itself in the before list.
        .pipe(map((data) => data.filter((events) => events.id != this.#event?.id && !this.profileService.blockedPublickKeys().includes(events.pubkey))))
    );
  }

  get after$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged
      .asObservable()
      .pipe(
        map((data) => {
          data.sort((a, b) => {
            return a.created_at > b.created_at ? -1 : 1;
          });

          return data;
        })
      ) // Don't render the event itself in the after list.
      .pipe(map((data) => data.filter((events) => events.id != this.#event?.id && !this.profileService.blockedPublickKeys().includes(events.pubkey))));
  }

  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged
      .asObservable()
      .pipe(
        map((data) => {
          data.sort((a, b) => {
            return a.created_at > b.created_at ? -1 : 1;
          });

          return data;
        })
      )
      .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey))));
  }

  get rootEvents$(): Observable<NostrEventDocument[]> {
    return this.events$.pipe(
      map((data) => {
        const filtered = data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
        return filtered;
      })
    );
  }

  #selectedEventSource = new ReplaySubject<string>();
  selectedEventChanges$ = this.#selectedEventSource.asObservable();

  #eventSource = new ReplaySubject<NostrEventDocument>();
  eventChanges$ = this.#eventSource.asObservable();

  // selectedEvent$ = combineLatest(this.selectedEventChanges$, this.eventChanges$).pipe(mergeMap());

  constructor(private storage: StorageService, private eventService: EventService, private profileService: ProfileService, private feedService: FeedService) {
    // Whenever the event has changed, we can go grab the parent and the thread itself
    this.#eventChanged.subscribe((event) => {
      if (event == null) {
        console.log('EVENT WAS NULL!');
        return;
      }

      console.log('EVENT CHANGED!!!', event);

      // Get the root event.
      let rootEventId = this.eventService.rootEventId(event);

      if (rootEventId) {
        this.feedService.downloadEvent(rootEventId).subscribe((event) => {
          console.log(event);
          this.#root = event;
          this.#rootChanged.next(this.#root);
          console.log('GOT ROOT EVENT', this.#root);
        });
      } else {
        this.#root = null;
        // Reset the root if the current event does not have one.
        this.#rootChanged.next(this.#root);
      }

      // If there is root, use that to download thread, if not, use the current event which is a root event.
      if (this.#root) {
        // Get all events in the thread.
        this.feedService.downloadThread(this.#root.id!).subscribe((events) => {
          console.log(events);
          this.#events = events;
          this.#eventsChanged.next(this.#events);
          console.log('GOT THREAD FOR ROOT', this.#root);
        });
      } else {
        // Get all events in the thread.
        this.feedService.downloadThread(event.id!).subscribe((events) => {
          console.log(events);
          this.#events = events;
          this.#eventsChanged.next(this.#events);
          console.log('GOT THREAD FOR EVENT', this.#event);
        });
      }

      // // If there are no rootEventId, grab ID from the event itself:
      // console.log('ROOT EVENT ID:', rootEventId);

      // if (rootEventId) {
      //   this.feedService.downloadEvent(rootEventId).subscribe((event) => {
      //     console.log(event);
      //     this.#root = event;
      //     this.#rootChanged.next(this.#root);
      //     console.log('GOT ROOT EVENT', this.#root);
      //   });
      // }
    });
  }

  async changeSelectedEvent(eventId: string) {
    // Get the event itself.
    const event = await this.storage.get<NostrEventDocument>(eventId);

    if (event) {
      this.#event = event;
      this.#eventChanged.next(this.#event);
    } else {
      // Go grab it from relays.
      this.feedService.downloadEvent(eventId).subscribe((event) => {
        this.#event = event;
        this.#eventChanged.next(this.#event);
      });
    }
  }

  /** Fetches the whole thread of data to be rendered in the UI. */
  async fetchThread(id: string) {
    // Second get the original post to render ontop of the page and all of the other events in e tags.
    // Third get the replies to the id supplied.
  }
}
