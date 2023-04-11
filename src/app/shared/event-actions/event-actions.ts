import { Component, Input } from '@angular/core';
import { NotesService } from 'src/app/services/notes';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { copyToClipboard } from '../utilities';
import { nip19 } from 'nostr-tools';
import { LabelService } from 'src/app/services/label';

@Component({
  selector: 'app-event-actions',
  templateUrl: './event-actions.html',
})
export class EventActionsComponent {
  @Input() fab: boolean = false;
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;
  @Input() event?: NostrNoteDocument | NostrEventDocument | any;

  constructor(public labelService: LabelService, private snackBar: MatSnackBar, private profileService: ProfileService, private notesService: NotesService, private utilities: Utilities) {}

  async saveNote() {
    if (!this.event) {
      return;
    }

    const note = this.event as NostrNoteDocument;
    note.saved = Math.floor(Date.now() / 1000);

    await this.notesService.putNote(note);
  }

  async removeNote() {
    if (!this.event) {
      return;
    }

    console.log('DELETE EVENT:', this.event);

    await this.notesService.deleteNote(this.event.id);
  }

  async follow(circle?: number) {
    console.log('FOLLOW:', this.profile);

    if (!this.profile) {
      return;
    }

    // If not already following, add a full follow and download recent:
    if (this.profile.status != 1) {
      await this.profileService.follow(this.profile.pubkey, circle);
      // this.feedService.downloadRecent([this.profile.pubkey]);
    } else {
      // If we already follow but just change the circle, do a smaller operation.
      await this.profileService.setCircle(this.profile.pubkey, circle);
    }
  }

  getNpub(hex: string) {
    return this.utilities.getNostrIdentifier(hex);
  }

  copyEvent() {
    this.copy(JSON.stringify(this.event));
  }

  copyProfileUrl(pubkey: string) {
    this.copy(`web+nostr:npub:${nip19.npubEncode(pubkey)}`);
  }

  copyNoteId(id: string) {
    this.copy(nip19.noteEncode(id));
  }

  async setLabel(id: string) {
    if (!this.event) {
      return;
    }

    let e = this.event as NostrNoteDocument;

    if (e.labels == null) {
      e.labels = [];
    } else {
      // TODO: Right now we only support a single label, so we'll reset
      // with whatever the user chooses.
      e.labels = [];
    }

    e.labels.push(id);

    await this.notesService.putNote(this.event);
  }

  copyNoteEventId(id: string) {
    // TODO: Copy the relays where we found this event from.
    let eventPointer: nip19.EventPointer = { id: id };
    this.copy(nip19.neventEncode(eventPointer));
  }

  copyNoteUrl(id: string) {
    // TODO: Copy the relays where we found this event from.
    let eventPointer: nip19.EventPointer = { id: id };
    this.copy(`web+nostr:nevent:${nip19.neventEncode(eventPointer)}`);
  }

  copyProfile() {
    if (!this.profile) {
      return;
    }

    // We only want to copy the public profile properties and nothing else.
    const profile: NostrProfile = {
      name: this.profile.name,
      about: this.profile.about,
      nip05: this.profile.nip05,
      picture: this.profile.picture,
      banner: this.profile.banner,
      website: this.profile.website,
      lud06: this.profile.lud06,
      lud16: this.profile.lud16,
      display_name: this.profile.display_name,
    };

    this.copy(JSON.stringify(profile));
  }

  copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async unfollow() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unfollow(this.profile.pubkey);
  }

  async mute() {
    if (!this.profile) {
      return;
    }

    await this.profileService.mute(this.profile.pubkey);
  }

  async unmute() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unmute(this.profile.pubkey);
  }

  async block() {
    if (!this.profile) {
      return;
    }

    await this.profileService.block(this.profile.pubkey);
  }

  async unblock() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unblock(this.profile.pubkey);
  }

  ngOnDestroy() {}

  async ngOnInit() {
    // TODO: THIS IS ABSOLUTELY NOT OPTIMAL! .. every rendering creates subs.

    if (this.event) {
      this.pubkey = this.event.pubkey;
      // this.profile = await this.profileService.getProfile(this.pubkey);
    } else if (this.profile) {
      this.pubkey = this.profile.pubkey;
    } else {
      // this.profile = await this.profileService.getProfile(this.pubkey);
    }
  }
}
