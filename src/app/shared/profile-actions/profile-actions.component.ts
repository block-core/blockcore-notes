import { Component, Input, ViewChild } from '@angular/core';
import { CirclesService } from 'src/app/services/circles.service';
import { NotesService } from 'src/app/services/notes.service';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { copyToClipboard } from '../utilities';
import { FeedService } from 'src/app/services/feed.service';

@Component({
  selector: 'app-profile-actions',
  templateUrl: './profile-actions.component.html',
})
export class ProfileActionsComponent {
  @Input() fab: boolean = false;
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;
  @Input() event?: NostrNoteDocument | NostrEventDocument | any;

  circles: Circle[] = [];

  constructor(private feedService: FeedService, private circlesService: CirclesService, private snackBar: MatSnackBar, private profileService: ProfileService, private notesService: NotesService, private utilities: Utilities) {}

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
    await this.feedService.downloadRecent([this.profile.pubkey]);
  }

  getNpub(hex: string) {
    return this.utilities.getNostrIdentifier(hex);
  }

  copyEvent() {
    this.copy(JSON.stringify(this.event));
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
      website: this.profile.website,
      lud06: this.profile.lud06,
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

  ngOnDestroy() {
    // TODO: THIS IS ABSOLUTELY NOT OPTIMAL! .. every rendering creates subs.
    if (this.circlesSub) {
      this.circlesSub.unsubscribe();
    }
  }

  private circlesSub?: Subscription;

  async loadCircles() {
    this.circles = await this.circlesService.list();
  }

  async ngOnInit() {
    // TODO: THIS IS ABSOLUTELY NOT OPTIMAL! .. every rendering creates subs.

    if (this.event) {
      this.pubkey = this.event.pubkey;
      this.profile = await this.profileService.getProfile(this.pubkey);
    } else if (this.profile) {
      this.pubkey = this.profile.pubkey;
    } else {
      this.profile = await this.profileService.getProfile(this.pubkey);
    }

    this.circlesSub = this.circlesService.notesChanged$.subscribe(() => {
      this.loadCircles();
    });
  }
}
