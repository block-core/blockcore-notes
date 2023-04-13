import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeDefinitionEvent, BlogEvent, Circle, NostrEvent, NostrEventDocument, NostrProfileDocument, NostrThreadEventDocument } from './interfaces';
import { tap, delay, timer, takeUntil, timeout, Observable, of, BehaviorSubject, map, combineLatest, single, Subject, Observer, concat, concatMap, switchMap, catchError, race } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from '../shared/create-note-dialog/create-note-dialog';
import { ApplicationState } from './applicationstate';
import { Event, Kind } from 'nostr-tools';
import { DataService } from './data';
import { EventService } from './event';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private eventService: EventService, private router: Router, public dialog: MatDialog, private appState: ApplicationState, private dataService: DataService) {}

  #showMore: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  showMore$ = this.#showMore.asObservable();

  /** Used to keep a quick reference to the active event that is has clicked on and want to view more details on. */
  currentEvent?: NostrEventDocument;
  currentProfile?: NostrProfileDocument;
  currentThread: NostrThreadEventDocument[] = [];

  showMore() {
    this.#showMore.next();
  }

  openFeed($event: any, circle: Circle) {
    // this.currentEvent = event;

    const paths = $event.composedPath();

    if (!paths || paths.length == 0) {
      return;
    }

    if (paths[0].className.indexOf('clickable') == -1) {
      return;
    }

    // if (!event.id) {
    //   debugger;
    // }

    this.router.navigate(['/feed', circle.id]);
  }

  openEvent($event: any, event: NostrEventDocument) {
    this.currentEvent = event;

    const paths = $event.composedPath();

    if (!paths || paths.length == 0) {
      return;
    }

    if (paths[0].className.indexOf('clickable') == -1) {
      return;
    }

    if (!event.id) {
      debugger;
    }

    this.router.navigate(['/e', event.id]);
  }

  openProfile($event: any, event: NostrProfileDocument) {
    this.currentProfile = event;

    const paths = $event.composedPath();

    if (!paths || paths.length == 0) {
      return;
    }

    if (paths[0].className.indexOf('clickable') == -1) {
      return;
    }

    this.router.navigate(['/p', event.pubkey]);
  }

  /** Saves a new note and navigates to it. */
  async saveNote(data: any) {
    console.log('save note data:', data);
    let note = data;

    if (typeof note !== 'string') {
      note = JSON.stringify(note);
    }

    let event = this.dataService.createEvent(Kind.Text, note);

    // Parse hashtags:
    event.tags = this.eventService.parseContentReturnTags(event.content);

    // TODO: We should likely save this event locally to ensure user don't loose their posts
    // if all of the network is down.
    const signedEvent = await this.dataService.signEvent(event);

    await this.dataService.publishEvent(signedEvent);

    this.router.navigate(['/e', signedEvent.id]);
  }

  /** Saves a new article and navigates to it. */
  async saveArticle(blog: BlogEvent) {
    console.log('save article data:', blog);
    let note = blog.content;

    if (typeof note !== 'string') {
      note = JSON.stringify(note);
    }

    let event = this.dataService.createEvent(Kind.Article, note);

    if (blog.slug) {
      event.tags.push(['d', blog.slug]);
    }

    if (blog.summary) {
      event.tags.push(['summary', blog.summary]);
    }

    if (blog.title) {
      event.tags.push(['title', blog.title]);
    }

    if (blog.image) {
      event.tags.push(['image', blog.image]);
    }

    if (!blog.published_at) {
      event.tags.push(['published_at', event.created_at.toString()]);
    } else {
      event.tags.push(['published_at', blog.published_at.toString()]);
    }

    const tags = blog.tags.split(',').filter((t) => t);

    for (let index = 0; index < tags.length; index++) {
      const tag = tags[index];
      event.tags.push(['t', tag]);
    }

    // TODO: We should likely save this event locally to ensure user don't loose their posts
    // if all of the network is down.
    const signedEvent = await this.dataService.signArticle(event);

    await this.dataService.publishEvent(signedEvent);

    // this.router.navigate(['/a', signedEvent.id]);
  }

  /** Saves a new badge definition */
  async saveBadgeDefinition(badge: BadgeDefinitionEvent) {
    console.log('save badge data:', badge);

    debugger;

    let event = this.dataService.createEvent(30009, '');

    if (badge.slug) {
      event.tags.push(['d', badge.slug]);
    }

    if (badge.description) {
      event.tags.push(['description', badge.description]);
    }

    if (badge.name) {
      event.tags.push(['name', badge.name]);
    }

    if (badge.image) {
      event.tags.push(['image', badge.image]);
    }

    if (badge.thumb) {
      event.tags.push(['thumb', badge.thumb]);
    }

    const tags = badge.hashtags;

    for (let index = 0; index < tags.length; index++) {
      const tag = tags[index];
      event.tags.push(['t', tag]);
    }

    // TODO: We should likely save this event locally to ensure user don't loose their posts
    // if all of the network is down.
    const signedEvent = await this.dataService.signBadgeDefinition(event);

    await this.dataService.publishEvent(signedEvent);

    // this.router.navigate(['/a', signedEvent.id]);
  }

  async issueBadge(slug: string, receivers: { pubkey: string; relay?: string }[]) {
    let event = this.dataService.createEvent(8, '');

    const author = `30009:${this.appState.getPublicKey()}:${slug}`;
    event.tags.push(['a', author]);

    for (let index = 0; index < receivers.length; index++) {
      const receiver = receivers[index];
      const receiverEntry = ['p', receiver.pubkey];

      if (receiver.relay) {
        receiverEntry.push(receiver.relay);
      }

      event.tags.push(receiverEntry);
    }

    // TODO: We should likely save this event locally to ensure user don't loose their posts
    // if all of the network is down.
    const signedEvent = await this.dataService.signEvent(event);

    await this.dataService.publishEvent(signedEvent);
  }

  createNote(): void {
    this.router.navigateByUrl('/editor');

    // const dialogRef = this.dialog.open(NoteDialog, {
    //   data: {},
    //   maxWidth: '100vw',
    //   panelClass: 'full-width-dialog',
    // });

    // dialogRef.afterClosed().subscribe(async (data) => {
    //   if (!data) {
    //     return;
    //   }

    //   await this.saveNote(data.note);
    // });
  }
}
