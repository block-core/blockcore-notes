import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NostrEvent, NostrEventDocument, NostrProfileDocument, NostrThreadEventDocument } from './interfaces';
import { tap, delay, timer, takeUntil, timeout, Observable, of, BehaviorSubject, map, combineLatest, single, Subject, Observer, concat, concatMap, switchMap, catchError, race } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from '../shared/create-note-dialog/create-note-dialog';
import { ApplicationState } from './applicationstate';
import { Event } from 'nostr-tools';
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

      console.log('dialog data:', data);
      let note = data.note;

      let event: Event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        content: note,
        pubkey: this.appState.getPublicKey(),
        tags: [],
      };

      // TODO: We should likely save this event locally to ensure user don't loose their posts
      // if all of the network is down.
      const signedEvent = await this.dataService.signEvent(event);

      await this.dataService.publishEvent(signedEvent);

      this.router.navigate(['/e', signedEvent.id]);

      // await this.feedService.publish(event);
    });
  }
}
