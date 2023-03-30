import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invitation, nip19Extension, PrivateChannel } from 'animiq-nip76-tools';
import { nip19 } from 'nostr-tools';
import { defaultSnackBarOpts, Nip76Service } from '../nip76.service';

export interface AddInvitationDialogData {
  channel: PrivateChannel;
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
  constructor(
    private snackBar: MatSnackBar,
    private nip76Service: Nip76Service,
    public dialogRef: MatDialogRef<AddInvitationDialogData>,
    @Inject(MAT_DIALOG_DATA) public data: AddInvitationDialogData,
  ) {
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

  async copyInviteWithoutSave() {
    if (this.valid) {
      let pointer: string;
      const threadPointer = {
        type: 0,
        docIndex: -1,
        signingKey: this.data.channel.dkxPost.signingParent!.publicKey,
        signingChain: this.data.channel.dkxPost.signingParent!.chainCode,
        cryptoKey: this.data.channel.dkxPost.cryptoParent.publicKey,
        cryptoChain: this.data.channel.dkxPost.cryptoParent.chainCode,
      };
      if (this.data.invitationType === 'password') {
        pointer = await nip19Extension.nprivateChannelEncode(threadPointer, this.data.password!);
      } else {
        const privateKey = await this.nip76Service.passwordDialog('Save RSVP');
        pointer = await nip19Extension.nprivateChannelEncode(threadPointer, privateKey, this.data.validPubkey);
      }
      navigator.clipboard.writeText(pointer);
      this.snackBar.open(`The invitation is now in your clipboard.`, 'Hide', defaultSnackBarOpts);
    }
  }

  clearForm() {
    this.error = '';
    this.valid = false;
    this.data = {
      invitationType: this.data.invitationType,
      channel: this.data.channel
    };
  }
}

