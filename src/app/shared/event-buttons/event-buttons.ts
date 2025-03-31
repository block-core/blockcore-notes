import { Component, ElementRef, HostListener, Input, ViewChild, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Kind } from 'nostr-tools';
import { DataService } from 'src/app/services/data';
import { EventService } from 'src/app/services/event';
import { NotesService } from 'src/app/services/notes';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';
import { ZapDialogComponent } from '../zap-dialog/zap-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-event-buttons',
    templateUrl: './event-buttons.html',
    styleUrls: ['./event-buttons.css'],
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      MatButtonModule,
      MatIconModule,
      MatFormFieldModule,
      MatInputModule,
      MatCardModule,
    ]
})
export class EventButtonsComponent {
  @Input() event?: NostrEventDocument;

  // TODO: This unfortunately creates multiple handlers for every single post in the UI.
  // Need to be optimized to only register whenever open is triggered.
  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    this.hideReply();
  }

  isEmojiPickerVisible = signal<boolean | undefined>(undefined);
  isEmojiPickerTextVisible = signal<boolean | undefined>(undefined);

  note?: string;

  replyOpen = signal(false);
  publishing = signal(false);
  error = signal('');
  profile = signal<NostrProfileDocument | undefined>(undefined);

  @ViewChild('replyInput') replyInput?: ElementRef;

  constructor(
    private eventService: EventService,
    private notesService: NotesService,
    private dataService: DataService,
    public optionsService: OptionsService,
    private profileService: ProfileService,
    private utilities: Utilities,
    public dialog: MatDialog
  ) {}

  async ngAfterViewInit() {
    let pubkey = this.event?.pubkey ? this.event?.pubkey : '';
    this.profile.set(await this.profileService.getProfile(pubkey));
  }

  async saveNote() {
    if (!this.event) {
      return;
    }

    const note = this.event as NostrNoteDocument;
    note.saved = Math.floor(Date.now() / 1000);

    await this.notesService.putNote(note);
  }

  openReply() {
    this.replyOpen.set(true);
    this.publishing.set(false);
    this.note = '';
    this.error.set('');

    setTimeout(() => {
      console.log(this.replyInput);
      this.replyInput?.nativeElement.focus();
    });
  }

  hideReply() {
    this.replyOpen.set(false);
    this.publishing.set(false);
    this.note = '';
    this.error.set('');
  }

  async addEmojiInText(e: { emoji: { native: any } }) {
    this.isEmojiPickerTextVisible.set(false);
    this.note = `${this.note}${e.emoji.native}`;
  }

  async addEmoji(e: { emoji: { native: any } }) {
    this.isEmojiPickerVisible.set(false);

    let reactionEvent = this.dataService.createEvent(Kind.Reaction, e.emoji.native);

    if (!this.event) {
      console.warn('Event is empty on reaction.');
      return;
    }

    reactionEvent.tags = Object.assign([], this.event.tags);

    reactionEvent.tags.push(['p', this.event.pubkey]);

    reactionEvent.tags.push(['e', this.event.id!]);

    const signedEvent = await this.dataService.signEvent(reactionEvent);

    console.log(signedEvent);

    await this.dataService.publishEvent(signedEvent);

    this.event.tags = reactionEvent.tags;
  }

  async addReply() {
    this.publishing.set(true);

    let replyEvent = this.dataService.createEvent(Kind.Text, this.note);

    if (!this.event) {
      console.warn('Event is empty on reply.');
      return;
    }

    replyEvent.tags = Object.assign([], this.eventService.getPublicKeyAndEventTags(this.event.tags));

    replyEvent.tags.push(['p', this.event.pubkey]);

    replyEvent.tags.push(['e', this.event.id!]);

    try {
      const signedEvent = await this.dataService.signEvent(replyEvent);
      console.log(signedEvent);
      await this.dataService.publishEvent(signedEvent);
      this.hideReply();
    } catch (err: any) {
      this.error.set(err.toString());
      console.log(err);
      this.publishing.set(false);
    }
  }

  async openDialog() {
    this.dialog.open(ZapDialogComponent, {
      width: '400px',
      data: {
        profile: this.profile(),
        event: this.event,
      },
    });
  }
}
