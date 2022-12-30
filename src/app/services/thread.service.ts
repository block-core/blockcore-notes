import { Injectable } from '@angular/core';
import { NostrEventDocument } from './interfaces';
import { Observable, BehaviorSubject, map, ReplaySubject, filter } from 'rxjs';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { EventService } from './event.service';
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

  #events: NostrEventDocument[] | null = [];
  #eventsChanged: BehaviorSubject<NostrEventDocument[] | null> = new BehaviorSubject<NostrEventDocument[] | null>(this.#events);

  hasLoaded = false;

  get before$(): Observable<NostrEventDocument[]> {
    return (
      this.events$
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
    return this.events$
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

  // TODO: This should aggregate likes/RTs, etc. pr. note.
  /** Currently drops kind = 7, this must be used to calculate up later on. */
  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged
      .asObservable()
      .pipe(filter((data) => data !== null))
      .pipe(
        map((data) => {
          data!.sort((a, b) => {
            return a.created_at > b.created_at ? -1 : 1;
          });

          return data;
        })
      )
      .pipe(map((data) => data!.filter((events) => events.kind != 7 && events.kind != 6))) // Filter out likes and "reposts".
      .pipe(map((data) => data!.filter((events) => !this.profileService.blockedPublickKeys().includes(events.pubkey))));
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
        return;
      }

      // Get the root event.
      let rootEventId = this.eventService.rootEventId(event);

      if (rootEventId) {
        this.feedService.downloadEvent(rootEventId).subscribe((event) => {
          console.log(event);
          this.#root = event;
          this.#rootChanged.next(this.#root);
        });
      } else {
        this.#root = null;
        // Reset the root if the current event does not have one.
        this.#rootChanged.next(this.#root);
      }

      if (!rootEventId) {
        rootEventId = event.id!;
      }

      this.feedService
        .downloadThread(rootEventId)
        // .pipe(
        //   catchError((err) => {
        //     console.log('WHOPS ERROR 222!!', err);
        //     throw new Error('Yeh');
        //   })
        // )
        // .pipe(
        //   finalize(() => {
        //     console.log('FINALIZER 2222!!');
        //   })
        // )
        .subscribe((events) => {
          this.hasLoaded = true;
          this.#events = events;
          this.#eventsChanged.next(this.#events);
        });
    });
  }

  async changeSelectedEvent(eventId: string) {
    this.hasLoaded = false;

    // Reset so UI doesn't show previous events.
    this.#events = null;
    this.#eventsChanged.next(this.#events);

    this.#event = null;
    this.#eventChanged.next(this.#event);

    // Get the event itself.
    const event = await this.storage.get<NostrEventDocument>(eventId, 'events');

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
}
