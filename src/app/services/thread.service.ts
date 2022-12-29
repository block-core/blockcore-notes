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
      )
      .pipe(map((data) => data.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey))));
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
      const rootEventId = this.eventService.rootEventId(event);

      console.log('ROOT EVENT ID:', rootEventId);

      if (rootEventId) {
        this.feedService.downloadEvent(rootEventId).subscribe((event) => {
          console.log(event);
          this.#root = event;
          this.#rootChanged.next(this.#root);
          console.log('GOT ROOT EVENT', this.#root);
        });

        // Get all events in the thread.
        this.feedService.downloadThread(rootEventId).subscribe((events) => {
          console.log(events);
          this.#events = events;
          this.#eventsChanged.next(this.#events);
          console.log('GOT ROOT EVENT', this.#root);
        });
      } else {
        this.#root = null;
        // Reset the root if the current event does not have one.
        this.#rootChanged.next(this.#root);
      }
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
        console.log(event);
        this.#eventChanged.next(event);
      });
    }
  }

  /** Fetches the whole thread of data to be rendered in the UI. */
  async fetchThread(id: string) {
    // Second get the original post to render ontop of the page and all of the other events in e tags.
    // Third get the replies to the id supplied.
  }
}
