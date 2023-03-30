import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { bech32 } from '@scure/base';
import { nip19Extension } from 'animiq-nip76-tools';

export interface AddChannelDialogData {
  channelPointer: string;
  password?: string;
}

@Component({
  selector: 'nip76-add-channel-dialog',
  templateUrl: './add-channel-dialog.component.html',
  styleUrls: ['./add-channel-dialog.component.scss']
})
export class AddChannelDialog {
  
  requirePassword = false;

  constructor(public dialogRef: MatDialogRef<AddChannelDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddChannelDialogData) {}

  onNoClick(): void {
    this.data.channelPointer = '';
    this.dialogRef.close();
  }

  onChannelPointerChange(){
    try{
      const words = bech32.decode(this.data.channelPointer, 5000).words;
      const pointerType = Uint8Array.from(bech32.fromWords(words))[0] as nip19Extension.PointerType;
      this.requirePassword = (pointerType & nip19Extension.PointerType.Password) == nip19Extension.PointerType.Password;
    } catch (error) {
      this.requirePassword = false;
    }
  }
}
