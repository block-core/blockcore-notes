import { Component, Input, ViewChild } from '@angular/core';
import { NotesService } from 'src/app/services/notes.service';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-profile-actions',
  templateUrl: './profile-actions.component.html',
})
export class ProfileActionsComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;
  @Input() event?: NostrNoteDocument | NostrEventDocument | any;

  constructor(private profileService: ProfileService, private notesService: NotesService, private utilities: Utilities) {}

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

  async follow(circle?: string) {
    console.log('FOLLOW:', this.profile);

    if (!this.profile) {
      return;
    }

    await this.profileService.follow(this.profile.pubkey, circle);
  }

  async unfollow() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unfollow(this.profile.pubkey);
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

  async ngOnInit() {
    if (this.event) {
      this.pubkey = this.event.pubkey;
      this.profile = await this.profileService.getProfile(this.pubkey);
    } else if (this.profile) {
      this.pubkey = this.profile.pubkey;
    } else {
      this.profile = await this.profileService.getProfile(this.pubkey);
    }
  }
}
