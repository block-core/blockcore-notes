import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Kind } from 'nostr-tools';
import { DataService } from 'src/app/services/data';
import { EventService } from 'src/app/services/event';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog } from '../profile-image-dialog/profile-image-dialog';

@Component({
  selector: 'app-event-buttons',
  templateUrl: './event-buttons.html',
  styleUrls: ['./event-buttons.css'],
})
export class EventButtonsComponent {
  @Input() event?: NostrEventDocument;

  // TODO: This unfortunately creates multiple handlers for every single post in the UI.
  // Need to be optimized to only register whenever open is triggered.
  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    this.hideReply();
  }

  isEmojiPickerVisible: boolean | undefined;
  isEmojiPickerTextVisible: boolean | undefined;

  note?: string;

  replyOpen = false;
  publishing = false;
  error = '';

  @ViewChild('replyInput') replyInput?: ElementRef;

  constructor(private eventService: EventService, private dataService: DataService, public optionsService: OptionsService, private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

  openReply() {
    this.replyOpen = true;
    this.publishing = false;
    this.note = '';
    this.error = '';

    setTimeout(() => {
      console.log(this.replyInput);
      this.replyInput?.nativeElement.focus();
    });
  }

  hideReply() {
    this.replyOpen = false;
    this.publishing = false;
    this.note = '';
    this.error = '';
  }

  async addEmojiInText(e: { emoji: { native: any } }) {
    // this.dateControl.setValue(this.dateControl.value + event.emoji.native);
    // this.data.note = `${this.data.note}${event.emoji.native}`;
    this.isEmojiPickerTextVisible = false;
    this.note = `${this.note}${e.emoji.native}`;
  }

  async addEmoji(e: { emoji: { native: any } }) {
    // this.dateControl.setValue(this.dateControl.value + event.emoji.native);
    // this.data.note = `${this.data.note}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;

    let reactionEvent = this.dataService.createEvent(Kind.Reaction, e.emoji.native);

    if (!this.event) {
      console.warn('Event is empty on reaction.');
      return;
    }

    // const rootEventId = this.eventService.rootEventId(this.event);
    // const replyEventId = this.eventService.replyEventId(this.event);

    // Clone the existing tags.
    reactionEvent.tags = Object.assign([], this.event.tags);

    // Add the public key of who we are reacting to.
    reactionEvent.tags.push(['p', this.event.pubkey]);

    // Add the event Id of who we are reacting to.
    reactionEvent.tags.push(['e', this.event.id!]);

    const signedEvent = await this.dataService.signEvent(reactionEvent);

    console.log(signedEvent);

    await this.dataService.publishEvent(signedEvent);

    // Replace tags on the local copy of the event.
    this.event.tags = reactionEvent.tags;
  }

  async addReply() {
    this.publishing = true;

    let replyEvent = this.dataService.createEvent(Kind.Text, this.note);

    if (!this.event) {
      console.warn('Event is empty on reply.');
      return;
    }

    // Clone the existing tags.
    replyEvent.tags = Object.assign([], this.event.tags);

    // Add the public key of who we are reacting to.
    replyEvent.tags.push(['p', this.event.pubkey]);

    // Add the event Id of who we are reacting to.
    replyEvent.tags.push(['e', this.event.id!]);

    try {
      const signedEvent = await this.dataService.signEvent(replyEvent);
      console.log(signedEvent);
      this.hideReply();
    } catch (err: any) {
      this.error = err.toString();
      console.log(err);
      this.publishing = false;
    }

    // await this.dataService.publishEvent(signedEvent);
  }
}
