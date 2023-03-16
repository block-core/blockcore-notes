import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AddChannelDialogData {
  channelPointer: string
}

@Component({
  selector: 'app-add-channel-dialog',
  templateUrl: './add-thread-dialog.component.html',
  styleUrls: ['./add-thread-dialog.component.scss']
})
export class AddChannelDialog {
  constructor(public dialogRef: MatDialogRef<AddChannelDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddChannelDialogData) {}

  onNoClick(): void {
    this.data.channelPointer = '';
    this.dialogRef.close();
  }
}
