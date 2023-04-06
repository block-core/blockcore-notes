import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup } from '@angular/forms';
import { Utilities } from 'src/app/services/utilities';
import { NostrProfileDocument, LNURLPayRequest, LNURLInvoice, NostrEventDocument, ParsedZap, ZappersListData } from 'src/app/services/interfaces';
import { ProfileService } from 'src/app/services/profile';

@Component({
  selector: 'app-zappers-list-dialog',
  templateUrl: './zappers-list-dialog.component.html',
  styleUrls: ['./zappers-list-dialog.component.scss'],
})
export class ZappersListDialogComponent {
  sendZapForm!: UntypedFormGroup;
  minSendable: number = 0;
  maxSendable: number = 0;
  profile!: NostrProfileDocument;
  amount: number = 0;
  comment = '';
  payRequest: LNURLPayRequest | null = null;
  invoice: LNURLInvoice = {
    pr: '',
  };
  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  error: string = '';
  event?: NostrEventDocument | undefined;
  zappers: Zapper[] = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: ZappersListData, private util: Utilities, private profileServ: ProfileService, public dialogRef: MatDialogRef<ZappersListDialogComponent>) {}

  async ngOnInit() {
    const zaps = this.data.zaps ? this.data.zaps : [];
    zaps.forEach(async (zap: ParsedZap) => {
      let zapper = zap.zapper;
      if (zapper !== undefined && zapper !== null) {
        this.profileServ.getProfile(zapper).then(async (profile) => {
          profile.display_name = profile.display_name || profile.name || this.util.getNostrIdentifier(profile.pubkey);
          this.zappers.push({ profile: profile, zap: zap });
        });
      }
    });
  }
}

interface Zapper {
  profile: NostrProfileDocument;
  zap: ParsedZap;
}
