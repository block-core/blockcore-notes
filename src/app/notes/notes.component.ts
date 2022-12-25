import { Component } from '@angular/core';
// import { relayInit, validateEvent, verifySignature, signEvent, getEventHash, getPublicKey } from 'nostr-tools';
import { relayInit } from 'nostr-tools';
import { Subscription } from 'rxjs';
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

  constructor(private notesService: NotesService) {}

  toggleDetails() {
    this.details = !this.details;
  }

  ngOnDestroy() {
    if (this.notesSub) {
      this.notesSub.unsubscribe();
    }
  }

  ngOnInit() {
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
