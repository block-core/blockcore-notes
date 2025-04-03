import { Component } from '@angular/core';
// import { relayInit, validateEvent, verifySignature, signEvent, getEventHash, getPublicKey } from 'nostr-tools';
import { Observable, Subscription, tap } from 'rxjs';
import { ApplicationState } from '../../services/applicationstate';
import { NostrNoteDocument } from '../../services/interfaces';
import { NotesService } from '../../services/notes';
import { LabelsComponent } from '../../shared/labels/labels';
import { EventHeaderComponent } from '../../shared/event-header/event-header';
import { EventActionsComponent } from '../../shared/event-actions/event-actions';
import { MatCardModule } from '@angular/material/card';
import { ContentComponent } from '../../shared/content/content';
import { LabelComponent } from '../../shared/label/label';
import { TranslateModule } from '@ngx-translate/core';
import { AgoPipe } from '../../shared/ago.pipe';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-notes',
  templateUrl: 'notes.html',
  styleUrls: ['notes.css'],
  imports: [LabelsComponent, MatButtonModule, CommonModule, EventHeaderComponent, EventActionsComponent, MatCardModule, ContentComponent, LabelComponent, TranslateModule, AgoPipe],
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
