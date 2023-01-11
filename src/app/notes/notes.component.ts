import { Component } from '@angular/core';
// import { relayInit, validateEvent, verifySignature, signEvent, getEventHash, getPublicKey } from 'nostr-tools';
import { Observable, Subscription, tap } from 'rxjs';
import { ApplicationState } from '../services/applicationstate.service';
import { NostrNoteDocument } from '../services/interfaces';
import { NotesService } from '../services/notes.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
})
export class NotesComponent {
  details = false;
  items: NostrNoteDocument[] = [];
  items$ = (this.notesService.items$ as Observable<NostrNoteDocument[]>).pipe(
    tap((items) => {
      this.items = items;
    })
  );

  constructor(private notesService: NotesService, private appState: ApplicationState) {}

  toggleDetails() {
    this.details = !this.details;
  }

  ngOnInit() {
    this.appState.title = 'Saved Notes';
    this.appState.goBack = true;
    this.appState.actions = [];
  }
}
