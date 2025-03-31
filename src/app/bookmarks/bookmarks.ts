import { Component, signal } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { NotesService } from '../services/notes';
import { NostrNoteDocument } from '../services/interfaces';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventComponent } from '../shared/event/event';

@Component({
    selector: 'app-bookmarks',
    templateUrl: './bookmarks.html',
    styleUrls: ['./bookmarks.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      EventComponent
    ]
})
export class BookmarksComponent {
  bookmarks = signal<NostrNoteDocument[]>([]);
  selectedNote = signal<NostrNoteDocument | null>(null);
  
  constructor(
    private appState: ApplicationState,
    private notesService: NotesService
  ) {}

  async ngOnInit() {
    this.appState.updateTitle('Bookmarks');
    this.appState.showBackButton = false;
    
    const savedNotes = await this.notesService.getNotes();
    this.bookmarks.set(savedNotes);
  }

  viewNote(note: NostrNoteDocument) {
    this.selectedNote.set(note);
  }

  async removeBookmark(note: NostrNoteDocument) {
    await this.notesService.deleteNote(note.id);
    const updatedBookmarks = this.bookmarks().filter(b => b.id !== note.id);
    this.bookmarks.set(updatedBookmarks);
  }

  trackById(index: number, item: NostrNoteDocument) {
    return item.id;
  }
}
