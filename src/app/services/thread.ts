import { Injectable } from '@angular/core';
import { EmojiEnum, NostrEventDocument, ThreadEntry, ThreadEntryChild } from './interfaces';
import { Observable, BehaviorSubject, map, ReplaySubject, filter, combineLatest } from 'rxjs';
import { ProfileService } from './profile';
import { EventService } from './event';
import { Kind } from 'nostr-tools';
import { DataService } from './data';
import { NavigationService } from './navigation';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  event: NostrEventDocument | undefined = undefined;
  #eventChanged: BehaviorSubject<NostrEventDocument | undefined> = new BehaviorSubject<NostrEventDocument | undefined>(this.event);
  event$ = this.#eventChanged.asObservable();

  #root: NostrEventDocument | undefined = undefined;
  #rootChanged: BehaviorSubject<NostrEventDocument | undefined> = new BehaviorSubject<NostrEventDocument | undefined>(this.#root);
  root$ = this.#rootChanged.asObservable();

  #events: NostrEventDocument[] | undefined = [];
  #eventsChanged: BehaviorSubject<NostrEventDocument[] | undefined> = new BehaviorSubject<NostrEventDocument[] | undefined>(this.#events);

  above: NostrEventDocument | undefined = undefined;
  #aboveChanged: BehaviorSubject<NostrEventDocument | undefined> = new BehaviorSubject<NostrEventDocument | undefined>(this.above);
  above$ = this.#aboveChanged.asObservable();

  hasLoaded = false;

  get before$(): Observable<NostrEventDocument[]> {
    return this.events$
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
            if (!this.event) {
              return false;
            }

            const eTags = this.eventService.eTags(this.event);

            // Skip all replies that are directly on root.
            if (eTags.length < 2) {
              return false;
            }

            const replyTag = this.eventService.replyEventId(this.event);

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
      );
    // Don't render the event itself in the before list.
    // TODO: FIX FILTER OF BLOCKED!
    //.pipe(map((data) => data.filter((events) => events.id != this.#event?.id && !this.profileService.blockedPublickKeys().includes(events.pubkey))))
  }

  get after$(): Observable<NostrEventDocument[]> {
    return this.events$.pipe(
      map((data) => {
        data.sort((a, b) => {
          return a.created_at > b.created_at ? -1 : 1;
        });

        return data;
      })
    );
    // Don't render the event itself in the after list.
    // TODO: FIX FILTER OF BLOCKED!
    // .pipe(map((data) => data.filter((events) => events.id != this.#event?.id && !this.profileService.blockedPublickKeys().includes(events.pubkey))))
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
      .pipe(map((data) => data!.filter((events) => events.kind != Kind.Reaction && (events.kind as Number) != 6))); // Filter out likes and reposts.
    // TODO: ADD FILTER OF BLOCKED!!
    // .pipe(map((data) => data!.filter(async (events) => await !this.profileService.blockedPublicKeys().includes(events.pubkey))));
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

  constructor(private eventService: EventService, private profileService: ProfileService, private dataService: DataService, private navigationService: NavigationService) {
    // Whenever the event has changed, we can go grab the parent and the thread itself
    this.#eventChanged.subscribe((event) => {
      if (event == null) {
        return;
      }

      // Get the root event.
      let rootEventId = this.eventService.rootEventId(event);

      if (rootEventId) {
        // this.feedService.downloadEvent(rootEventId).subscribe((event) => {
        //   // console.log('DOWNLOAD EVENT CALLBACK:', event);
        //   this.#root = event;
        //   this.#rootChanged.next(this.#root);
        // });
      } else {
        this.#root = undefined;
        // Reset the root if the current event does not have one.
        this.#rootChanged.next(this.#root);
      }

      if (!rootEventId) {
        rootEventId = event.id!;
      }

      // Grab the immediate parent, which will be clickable.
      const parentId = this.eventService.parentEventId(event);

      this.above = undefined;
      this.#aboveChanged.next(this.above);

      // If not parent Id, it means user is looking at root so we don't need to load additional events.
      if (parentId) {
        this.dataService.downloadEvent(parentId).subscribe((event) => {
          this.above = event;
          this.#aboveChanged.next(this.above);
        });
      }

      // this.feedService
      //   .downloadThread(rootEventId)
      //   // .pipe(
      //   //   catchError((err) => {
      //   //     console.log('WHOPS ERROR 222!!', err);
      //   //     throw new Error('Yeh');
      //   //   })
      //   // )
      //   // .pipe(
      //   //   finalize(() => {
      //   //     console.log('FINALIZER 2222!!');
      //   //   })
      //   // )
      //   .subscribe((events) => {
      //     this.hasLoaded = true;
      //     this.#events = events;
      //     this.#eventsChanged.next(this.#events);
      //   });
    });
  }

  // treeCache = new Map();
  // treeCache: NostrEventDocument[];
  threadEvents: NostrEventDocument[] = [];
  threadIds: ThreadEntry[] = [];
  threadId?: string;

  getEvent(id: string) {
    return this.threadEvents.find((e) => e.id == id);
  }

  getTreeEntry(id?: string) {
    if (!id) {
      return undefined;
    }

    const thread = this.threadIds.find((t) => t.id == id);

    if (!thread) {
      return undefined;
    }

    thread.children.sort((a: ThreadEntryChild, b: ThreadEntryChild) => b.date - a.date);

    return thread;
  }

  buildTree(event: NostrEventDocument, rootId: string) {
    // console.log('THREAD EVENT:', event);
    if (!event || !event.id) {
      return;
    }

    const existingIndex = this.threadEvents.findIndex((e) => e.id === event.id);

    if (existingIndex > -1) {
      return;
    }

    this.threadEvents.push(event);

    const eTags = event.tags.filter((t) => t[0] === 'e');
    const rootIdInEvent = this.rootEventId(eTags); // TODO: Remove this, just temporary for verification.
    const replyId = this.replyEventId(eTags, event);

    let existingThreadIndex = this.threadIds.findIndex((t) => t.id === replyId);

    let thread: any;

    // If the aggregated child list doesn't exists, create it first.
    if (existingThreadIndex === -1) {
      thread = { id: replyId, children: [], reactions: {}, boosts: 0 };
      this.threadIds.push(thread);
    } else {
      thread = this.threadIds[existingThreadIndex];
    }

    const existingThreadChildIndex = thread.children.findIndex((t: ThreadEntryChild) => t.id === event.id);

    if (existingThreadChildIndex > -1) {
      return;
    }

    if (event.kind == 1) {
      thread.children.push({ id: event.id, date: event.created_at });
      thread.children.sort((a: ThreadEntryChild, b: ThreadEntryChild) => b.date - a.date);
    } else if (event.kind == 7) {
      if (event.content == '' || event.content == '+') {
        if (!thread.reactions[EmojiEnum['👍']]) {
          thread.reactions[EmojiEnum['👍']] = 1;
        } else {
          thread.reactions[EmojiEnum['👍']]++;
        }
      } else if (event.content == '-') {
        if (!thread.reactions[EmojiEnum['👎']]) {
          thread.reactions[EmojiEnum['👎']] = 1;
        } else {
          thread.reactions[EmojiEnum['👎']]++;
        }
      } else {
        if (!thread.reactions[event.content]) {
          thread.reactions[event.content] = 1;
        } else {
          thread.reactions[event.content]++;
        }
      }
    } else if ((event.kind as any) == 6) {
      thread.boosts++;
    } else {
      debugger;
    }

    //this.treeCache.set(`${replyId}:${event.id}`, event);
    //console.log(this.treeCache);

    // let list = this.treeCache[replyId][event.id] = event;

    // if (!list) {
    //   // list = this.treeCache[event.id] = [];
    // }

    // list.findIndex()

    // this.treeCache[event.id] = [];

    // Always assume the first eTag is root for now. Implement support

    // return data.filter((events) => !events.tags.find((t) => t[0] === 'e'));
    // event.tags;
  }

  replyEventId(tags: string[][], event: NostrEventDocument) {
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];

      // If more than 4, we likely have "root" or "reply"
      if (tag.length > 3) {
        if (tag[3] == 'reply') {
          return tag[1];
        }
      }
    }

    // This is for likes, etc. that is done directly on original post.
    if (tags[1] == undefined) {
      return tags[0][1];
    }

    return tags[1][1];
  }

  rootEventId(tags: string[][]) {
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];

      // If more than 4, we likely have "root" or "reply"
      if (tag.length > 3) {
        if (tag[3] == 'root') {
          return tag[1];
        }
      }
    }

    return tags[0][1];
  }

  loadEventThread(eventId: string) {
    this.navigationService.currentThread = [];
    this.threadEvents = [];
    this.threadIds = [];
    this.threadId = eventId;

    this.dataService.downloadEventsByTags([{ ['#e']: [eventId] }]).subscribe((event) => {
      this.buildTree(event, eventId);
    });
  }

  async changeSelectedEvent(eventId?: string, event?: NostrEventDocument) {
    this.hasLoaded = false;

    this.#root = undefined;
    this.#rootChanged.next(this.#root);

    // Reset so UI doesn't show previous events.
    this.#events = undefined;
    this.#eventsChanged.next(this.#events);

    if (event) {
      this.event = event;
      this.#eventChanged.next(this.event);

      this.loadEventThread(event.id!);
    } else {
      this.event = undefined;
      this.#eventChanged.next(this.event);

      if (eventId) {
        this.dataService.downloadEvent(eventId).subscribe((event) => {
          this.event = event;
          this.#eventChanged.next(this.event);
        });

        this.loadEventThread(eventId);
      }
    }

    // Get the event itself.
    // const event = await this.storage.get<NostrEventDocument>(eventId, 'events');

    // if (event) {
    //   this.#event = event;
    //   this.#eventChanged.next(this.#event);
    // } else {
    //   // console.log('DOWNLOADING2:', eventId);
    //   // Go grab it from relays.
    //   this.feedService.downloadEvent(eventId).subscribe((event) => {
    //     // console.log('DOWNLOAD EVENT CALLBACK 2:', event);
    //     this.#event = event;
    //     this.#eventChanged.next(this.#event);
    //   });
    // }
  }
}
