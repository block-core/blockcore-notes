import { Component, Input, ViewChild } from '@angular/core';
import { CircleService } from 'src/app/services/circle';
import { NotesService } from 'src/app/services/notes';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { Circle, NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument, ProfileStatus } from '../../services/interfaces';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { copyToClipboard } from '../utilities';
import { nip19 } from 'nostr-tools';
import { UIService } from 'src/app/services/ui';
import { ApplicationState } from 'src/app/services/applicationstate';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-actions',
  templateUrl: './profile-actions.html',
  styleUrls: ['./profile-actions.css'],
})
export class ProfileActionsComponent {
  @Input() fab: boolean = false;
  // @Input() showFollow: boolean = false;
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;
  @Input() event?: NostrNoteDocument | NostrEventDocument | any;

  // get showFollowBack() {
  //   if (!this.profile) {
  //     return false;
  //   }

  //   const pubKey = this.appState.getPublicKey();

  //   if (this.profile.following) {
  //     return this.profile.following.includes(pubKey);
  //   }

  //   return false;
  // }

  constructor(
    private appState: ApplicationState,
    private ui: UIService,
    public circleService: CircleService,
    private snackBar: MatSnackBar,
    private profileService: ProfileService,
    private notesService: NotesService,
    private utilities: Utilities,
    private router: Router
  ) {}

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

  openBadges(pubkey: string) {
    this.router.navigate(['/badges', pubkey]);
  }

  async follow(circle?: number) {
    if (circle == null) {
      circle = 0;
    }

    if (!this.profile) {
      this.profile = await this.profileService.follow(this.pubkey, circle);
    } else {
      // If not already following, add a full follow and download recent:
      if (this.profile.status !== ProfileStatus.Follow) {
        // Update the profile so UI updates immediately.
        this.profile.circle = circle;
        this.profile.status = 1;
        this.profile = await this.profileService.follow(this.profile.pubkey, circle);
      } else {
        this.profile.circle = circle;
        // If we already follow but just change the circle, do a smaller operation.
        this.profile = await this.profileService.setCircle(this.profile.pubkey, circle);
      }
    }
  }

  // updateProfile(pubkey: string) {
  //   this.profileService.getProfile(pubkey).subscribe((profile) => {
  //     this.profile = profile;
  //     this.profileService.setItem(profile);
  //   });
  // }

  getNpub(hex: string) {
    return this.utilities.getNostrIdentifier(hex);
  }

  copyEvent() {
    this.copy(JSON.stringify(this.event));
  }

  copyProfileUrl(pubkey: string) {
    this.copy(`web+nostr:npub:${nip19.npubEncode(pubkey)}`);
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
      website: this.profile.website,
      banner: this.profile.banner,
      lud06: this.profile.lud06,
      lud16: this.profile.lud16,
      display_name: this.profile.display_name,
    };

    this.copy(JSON.stringify(profile));
  }

  copyFollowing() {
    this.copy(JSON.stringify(this.profile!.following));
  }

  copyRelays() {
    this.copy(this.profile!.relays);
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

    this.profile.status = ProfileStatus.Public;
    this.profile.followed = undefined;
    this.profile.circle = undefined;

    this.profile = await this.profileService.unfollow(this.profile.pubkey);
    // this.updateProfile(this.profile.pubkey);
  }

  async mute() {
    if (!this.profile) {
      return;
    }

    await this.profileService.mute(this.profile.pubkey);
    // this.updateProfile(this.profile.pubkey);
  }

  async unmute() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unmute(this.profile.pubkey);
    // this.updateProfile(this.profile.pubkey);
  }

  async block() {
    if (!this.profile) {
      return;
    }

    await this.profileService.block(this.profile.pubkey);
    // this.updateProfile(this.profile.pubkey);
  }

  async unblock() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unblock(this.profile.pubkey);
    // this.updateProfile(this.profile.pubkey);
  }

  shareProfile(profile?: NostrProfileDocument) {
    if (!profile) {
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: profile.name,
          text: profile.about,
          url: 'https://notes.blockcore.net/p/' + profile!.pubkey,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    }
  }

  ngOnDestroy() {}

  async ngOnInit() {
    if (this.event) {
      this.pubkey = this.event.pubkey;
    } else if (this.profile) {
      this.pubkey = this.profile.pubkey;
    }
  }
}
