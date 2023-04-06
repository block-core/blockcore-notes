import { Component } from '@angular/core';
// import { relayInit, validateEvent, verifySignature, signEvent, getEventHash, getPublicKey } from 'nostr-tools';
import { Observable, Subscription, tap } from 'rxjs';
import { ApplicationState } from '../services/applicationstate';
import { NostrNoteDocument } from '../services/interfaces';
import { NotesService } from '../services/notes';

@Component({
  selector: 'app-notes',
  templateUrl: 'notes.html',
  styleUrls: ['notes.css'],
})
export class NotesComponent {
  details = false;
  // items: NostrNoteDocument[] = [];
  // items$ = (this.notesService.items$ as Observable<NostrNoteDocument[]>).pipe(
  //   tap((items) => {
  //     this.items = items;
  //   })
  // );

  constructor(public notesService: NotesService, private appState: ApplicationState) {}

  toggleDetails() {
    this.details = !this.details;
  }

  filterNotes(labels: string[]) {
    this.notesService.filterByLabels(labels);
  }

  async ngOnInit() {
    this.appState.updateTitle('Bookmarks');
    this.appState.goBack = true;
    this.appState.actions = [];

    // Load the notes when notes component is opened:
    await this.notesService.load();
  }
}
