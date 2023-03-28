import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { nip19 } from 'nostr-tools';

export interface AddInvitationDialogData {
  invitationType: 'pubkey' | 'password';
  pubkey?: string;
  validPubkey?: string;
  password?: string;
  password2?: string;

}

@Component({
  selector: 'app-nip76-add-invitation',
  templateUrl: './nip76-add-invitation.component.html',
  styleUrls: ['./nip76-add-invitation.component.scss']
})
export class Nip76AddInvitationComponent {
  error!: string;
  valid = false;
  constructor(public dialogRef: MatDialogRef<AddInvitationDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddInvitationDialogData) {
    data.invitationType = 'pubkey';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updatePubkey() {
    this.error = '';
    this.data.validPubkey = '';
    try {
      if (this.data.pubkey!.startsWith('npub')) {
        this.data.pubkey = this.data.validPubkey = nip19.decode(this.data.pubkey!).data as any;
        this.valid = true;
      } else if (this.data.pubkey!.match(/^[0-9a-f]{64}$/i)) {
        this.data.validPubkey = nip19.decode(nip19.npubEncode(this.data.pubkey!)).data as any;
        this.valid = true;
      } else {
        this.error = 'This does not appear to be a valid public key.'
        this.valid = false;
      }
    } catch (err: any) {
      this.error = err.message;
      this.valid = false;
    }
  }

  updatePassword() {
    this.error = '';
    if (this.data.password!.length < 4) {
      this.error = 'Password must be at least 4 characters.'
      this.valid = false;
    } else if (this.data.password !== this.data.password2) {
      this.error = 'Password was not entered the same.'
      this.valid = false;
    } else {
      this.valid = true;
    }
  }

  clearForm() {
    this.error = '';
    this.valid = false;
    this.data = {
      invitationType: this.data.invitationType
    };
  }
}

