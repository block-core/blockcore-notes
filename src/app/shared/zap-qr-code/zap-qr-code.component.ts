import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LNURLInvoice, NostrProfileDocument } from '../../services/interfaces';
import { Utilities } from '../../services/utilities';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { QRCodeComponent } from 'angularx-qrcode';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface InvoiceQrCodeDialogData {
  invoice: LNURLInvoice,
  profile: NostrProfileDocument
}

@Component({
    selector: 'app-zap-qr-code',
    templateUrl: './zap-qr-code.component.html',
    styleUrls: ['./zap-qr-code.component.scss'],
    standalone: true,
    imports: [
      CommonModule,
      MatButtonModule,
      QRCodeComponent,
      MatCardModule,
      MatIconModule,
      MatTooltipModule
    ]
})
export class ZapQrCodeComponent implements OnInit {
  invoice: LNURLInvoice = {
    pr: ""
  }
  profile!: NostrProfileDocument
  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: InvoiceQrCodeDialogData,
    private util: Utilities
  ) {}

  async ngOnInit() {
    this.invoice = this.data.invoice
    this.profile = this.data.profile
    this.updateProfileDetails()
  }

  async updateProfileDetails() {
    if (!this.profile) {
      return;
    }
    if (this.profile.picture) {
      this.imagePath = this.profile.picture;
    }
    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;
    this.profileName = this.profile.display_name || this.profile.name || this.profileName;
  }

  copy(text: string) {
    this.util.copy(text);
  }
}
