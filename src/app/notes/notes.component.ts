import { Component } from '@angular/core';
// import { relayInit, validateEvent, verifySignature, signEvent, getEventHash, getPublicKey } from 'nostr-tools';
import { relayInit } from 'nostr-tools';
import { Subscription } from 'rxjs';
import { ApplicationState } from '../services/applicationstate.service';
import { NostrNoteDocument } from '../services/interfaces';
import { NotesService } from '../services/notes.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
})
export class NotesComponent {
  notesSub?: Subscription;
  notes: NostrNoteDocument[] = [];
  details = false;

  constructor(private notesService: NotesService, private appState: ApplicationState) {}

  toggleDetails() {
    this.details = !this.details;
  }

  ngOnDestroy() {
    if (this.notesSub) {
      this.notesSub.unsubscribe();
    }

    console.log('NOTES DESTROYED!!');
  }

  ngOnInit() {
    this.appState.title = 'Saved Notes';

    this.notesSub = this.notesService.notesChanged$.subscribe(async () => {
      console.log('RELOADING NOTES!!!');
      await this.loadNotes();
      console.log('DONE NOTES!!!');
    });
  }

  async loadNotes() {
    this.notes = await this.notesService.list();
  }
}
