import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Circle, NostrEvent, NostrEventDocument, NostrProfileDocument, NostrThreadEventDocument } from './interfaces';
import { tap, delay, timer, takeUntil, timeout, Observable, of, BehaviorSubject, map, combineLatest, single, Subject, Observer, concat, concatMap, switchMap, catchError, race } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from '../shared/create-note-dialog/create-note-dialog';
import { ApplicationState } from './applicationstate';
import { Event, Kind } from 'nostr-tools';
import { DataService } from './data';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private router: Router, public dialog: MatDialog, private appState: ApplicationState, private dataService: DataService) {}

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

    // TODO: We should likely save this event locally to ensure user don't loose their posts
    // if all of the network is down.
    const signedEvent = await this.dataService.signEvent(event);

    await this.dataService.publishEvent(signedEvent);

    this.router.navigate(['/e', signedEvent.id]);
  }

  createNote(): void {
    const dialogRef = this.dialog.open(NoteDialog, {
      data: {},
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (data) => {
      if (!data) {
        return;
      }

      await this.saveNote(data.note);
    });
  }
}
