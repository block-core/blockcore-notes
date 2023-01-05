import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { CirclesService } from 'src/app/services/circles.service';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { Circle, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog, ProfileImageDialogData } from '../profile-image-dialog/profile-image-dialog';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.css'],
})
export class ProfileHeaderComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;

  static defaultProfileImage = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  circle?: Circle;
  muted? = false;
  npub!: string;

  constructor(private profiles: ProfileService, public dialog: MatDialog, private sanitizer: DomSanitizer, private circleService: CirclesService, private utilities: Utilities) {}

  async ngAfterViewInit() {}

  get imagePath() {
    if (this.profile?.picture) {
      return this.profile.picture;
    }

    return ProfileHeaderComponent.defaultProfileImage;
  }

  showProfileImage() {
    this.dialog.open(ProfileImageDialog, {
      data: { picture: this.imagePath },
    });
  }

  getLightningLabel(lud06: string) {
    if (lud06.indexOf('@') > -1) {
      return lud06;
    } else {
      return lud06;
    }
  }

  async ngOnInit() {
    if (!this.profile) {
      this.profile = await this.profiles.getProfile(this.pubkey);
      this.npub = this.utilities.getNostrIdentifier(this.pubkey);

      if (!this.profile) {
        return;
      }
    } else {
      this.pubkey = this.profile.pubkey;
      this.npub = this.utilities.getNostrIdentifier(this.profile.pubkey);
    }

    this.tooltip = this.profile.about;

    // If the user has name in their profile, show that and not pubkey.
    // this.profileName = this.profile.name || this.profileName;

    this.circle = await this.circleService.getCircle(this.profile.circle);

    this.muted = this.profile.mute;
  }

  copy(text: string) {
    this.utilities.copy(text);
  }

  getWellKnownLink(nip05: string) {
    if (nip05.indexOf('@') === -1) {
      return '';
    }

    const values = nip05.split('@');
    const url = `https://${values[1]}/.well-known/nostr.json?name=${values[0]}`;
    return url;
  }

  sanitize(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustUrl(url);
    return clean;
  }
}
