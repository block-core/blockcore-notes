import * as nostrTools from 'nostr-tools';
import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Kind } from 'nostr-tools';
import { DataService } from 'src/app/services/data';
import { EventService } from 'src/app/services/event';
import { NostrEventDocument } from 'src/app/services/interfaces';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { PostDocument } from '../../../../../../animiq-nip76-tools/dist/src';
import { EventButtonsComponent } from '../../shared/event-buttons/event-buttons';
import { Nip76Service } from '../nip76.service';
import { NotesService } from 'src/app/services/notes';
@Component({
  selector: 'app-nip76-event-buttons',
  templateUrl: '../../shared/event-buttons/event-buttons.html',
  styleUrls: ['../../shared/event-buttons/event-buttons.css']
})
export class Nip76EventButtonsComponent extends EventButtonsComponent {

  private _doc!: PostDocument;
  @Input()
  set doc(doc: PostDocument) {
    this._doc = doc;
    this.event = doc.nostrEvent as NostrEventDocument;
  }
  get doc(): PostDocument { return this._doc; }

  constructor(
    private nip76Service: Nip76Service,
    eventService: EventService,
    notesService: NotesService,
    dataService: DataService,
    optionsService: OptionsService,
    profileService: ProfileService,
    utilities: Utilities,
    dialog: MatDialog) {
    super(eventService, notesService, dataService, optionsService, profileService, utilities, dialog);
  }

  override async addEmoji(e: { emoji: { native: any } }) {
    this.isEmojiPickerVisible = false;
    const reactionDoc = await this.nip76Service.saveReaction(this.doc, e.emoji.native, nostrTools.Kind.Reaction);
  }

  override async addReply() {
    this.isEmojiPickerVisible = false;
    const reactionDoc = await this.nip76Service.saveReaction(this.doc, this.note!, nostrTools.Kind.Text);
    this.hideReply();
  }
}