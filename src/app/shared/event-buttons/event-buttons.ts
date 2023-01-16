import { Component, Input } from '@angular/core';
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

  isEmojiPickerVisible: boolean | undefined;

  constructor(private eventService: EventService, private dataService: DataService, public optionsService: OptionsService, private profileService: ProfileService, private utilities: Utilities, public dialog: MatDialog) {}

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
}
