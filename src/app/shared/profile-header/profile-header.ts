import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CircleService } from 'src/app/services/circle';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { Circle, NostrProfileDocument } from '../../services/interfaces';
import { ProfileImageDialog, ProfileImageDialogData } from '../profile-image-dialog/profile-image-dialog';
import * as QRCode from 'qrcode';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/services/ui';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.html',
  styleUrls: ['./profile-header.css'],
})
export class ProfileHeaderComponent {
  @Input() pubkey: string = '';
  // @Input() profile?: NostrProfileDocument;

  static defaultProfileImage = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  circle?: Circle;
  npub!: string;
  qr06?: string;
  qr16?: string;

  constructor(public ui: UIService, public profileService: ProfileService, public dialog: MatDialog, public circleService: CircleService, public utilities: Utilities) {}

  async ngAfterViewInit() {}

  // get item() {
  //   if (this.profile) {
  //     return this.profile;
  //   } else {
  //     return this.profileService.item;
  //   }
  // }

  get imagePath() {
    if (this.ui.profile!.picture) {
      return this.ui.profile!.picture;
    }

    return ProfileHeaderComponent.defaultProfileImage;
  }

  getBannerBackgroundStyle(banner?: string) {
    if (!banner) {
      return '';
      // return 'url(https://dafb3cv85j5xj.cloudfront.net/blog/wp-content/uploads/2017/04/journey.gif)';
    }

    return `url(${banner})`;

    // return this.utilities.sanitizeStyleUrl(banner);
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

  paymentVersion = 'lud06';

  // toggleLn() {
  //   if (!this.profile) {
  //     return;
  //   }

  //   if (this.profile.lud16 && this.profile.lud06) {
  //     this.paymentVersion = this.paymentVersion == 'lud06' ? 'lud06' : 'lud16';
  //   }
  // }

  // async getCircle(id: number) {
  //   return this.circleService.get(id);
  // }

  async ngOnInit() {
    // if (!this.profile) {
    //   this.profile = await this.profileService.getLocalProfile(this.pubkey);
    //   this.npub = this.utilities.getNostrIdentifier(this.pubkey);
    //   if (!this.profile) {
    //     return;
    //   }
    // } else {
    //   this.pubkey = this.profile.pubkey;
    //   this.npub = this.utilities.getNostrIdentifier(this.profile.pubkey);
    // }
    // this.profileService.setItem(this.profile);
    // this.tooltip = this.profile.about;
    // If the user has name in their profile, show that and not pubkey.
    // this.profileName = this.profile.name || this.profileName;
    // this.circle = await this.circleService.get(this.profile.circle);
    // Pre-generate the QR value as we had some issues doing it dynamically.
    // if (this.profile.lud06) {
    //   this.qr06 = await QRCode.toDataURL('lightning:' + this.profile.lud06, {
    //     errorCorrectionLevel: 'L',
    //     margin: 2,
    //     scale: 5,
    //   });
    // }
    // if (this.profile.lud16) {
    //   this.qr16 = await QRCode.toDataURL('lightning:' + this.profile.lud16, {
    //     errorCorrectionLevel: 'L',
    //     margin: 2,
    //     scale: 5,
    //   });
    // }
    // if (this.profile.lud16) {
    //   this.paymentVersion = 'lud16';
    // }
  }

  displayNIP05(nip05: string) {
    if (nip05.startsWith('_@')) {
      return nip05.substring(2);
    }

    return nip05;
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
}
