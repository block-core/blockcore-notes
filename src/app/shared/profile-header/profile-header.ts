import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CircleService } from 'src/app/services/circle';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { Circle, NostrProfileDocument, ProfileStatus } from '../../services/interfaces';
import { ProfileImageDialog, ProfileImageDialogData } from '../profile-image-dialog/profile-image-dialog';
import * as QRCode from 'qrcode';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/services/ui';
import { ApplicationState } from 'src/app/services/applicationstate';
import { nip05 } from 'nostr-tools';
import { ZapDialogComponent } from '../zap-dialog/zap-dialog.component';
import { ZapUiService } from 'src/app/services/zap-ui';

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
  // npub!: string;
  qr06?: string;
  qr16?: string;
  userPubKey: string;
  isValidNip05: boolean = false;

  constructor(public zapUi: ZapUiService, private appState: ApplicationState, public ui: UIService, public profileService: ProfileService, public dialog: MatDialog, public circleService: CircleService, public utilities: Utilities) {
    this.userPubKey = this.appState.getPublicKey();
  }

  async follow(profile?: NostrProfileDocument) {
    if (!profile) {
      return;
    }

    const circle = 0;

    // If not already following, add a full follow and download recent:
    if (profile.status !== ProfileStatus.Follow) {
      // Update the profile so UI updates immediately.
      profile.circle = circle;
      profile.status = 1;
      profile = await this.profileService.follow(profile.pubkey, circle);
    } else {
      profile.circle = circle;
      // If we already follow but just change the circle, do a smaller operation.
      profile = await this.profileService.setCircle(profile.pubkey, circle);
    }
  }

  isFollowing(profile: NostrProfileDocument) {
    if (!profile || !profile.following) {
      return false;
    }

    return profile.following.includes(this.userPubKey);
  }

  get imagePath() {
    if (this.ui.profile!.picture) {
      return this.ui.profile!.picture;
    }

    return ProfileHeaderComponent.defaultProfileImage;
  }

  showProfileImage() {
    this.dialog.open(ProfileImageDialog, {
      data: { picture: this.imagePath },
    });
  }

  // getLightningLabel(lud06: string) {
  //   if (lud06.indexOf('@') > -1) {
  //     return lud06;
  //   } else {
  //     return lud06;
  //   }
  // }

  // paymentVersion = 'lud06';

  subscriptions: Subscription[] = [];

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  async ngOnInit() {
    this.subscriptions.push(
      this.ui.profile$.subscribe(async (profile) => {
        if (!profile) {
          return;
        }

        // Pre-generate the QR value as we had some issues doing it dynamically.
        if (profile.lud06) {
          this.qr06 = await QRCode.toDataURL('lightning:' + profile.lud06, {
            errorCorrectionLevel: 'L',
            margin: 2,
            scale: 5,
          });
        }
        if (profile.lud16) {
          this.qr16 = await QRCode.toDataURL('lightning:' + profile.lud16, {
            errorCorrectionLevel: 'L',
            margin: 2,
            scale: 5,
          });
        }
        if (profile.nip05) {
          let nip05Data = null;
          try {
            nip05Data = await nip05.queryProfile(profile?.nip05);
            this.isValidNip05 = nip05Data?.pubkey == profile?.pubkey;
          } catch (_) {
            console.log('failed to fetch NIP05 identifier');
          }
        }
      })
    );
  }

  displayNIP05(nip05: string) {
    if (nip05 && nip05.startsWith('_@')) {
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

  openDialog(profile?: NostrProfileDocument): void {
    this.dialog.open(ZapDialogComponent, {
      width: '400px',
      data: {
        profile: profile,
      },
    });
  }
}
