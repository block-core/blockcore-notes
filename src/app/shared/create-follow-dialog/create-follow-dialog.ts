import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FollowDialogData {
  note: string;
}

@Component({
  selector: 'create-follow-dialog',
  templateUrl: 'create-follow-dialog.html',
  styleUrls: ['create-follow-dialog.scss'],
})
export class FollowDialog {
  constructor(public dialogRef: MatDialogRef<FollowDialogData>, @Inject(MAT_DIALOG_DATA) public data: FollowDialogData) {
    this.dialogRef.updateSize('70%');
    this.dialogRef.updatePosition({ top: '50px' });

    this.data.note = '';
  }

  onNoClick(): void {
    this.data.note = '';
    this.dialogRef.close();
  }

  public isEmojiPickerVisible: boolean | undefined;
  public addEmoji(event: { emoji: { native: any } }) {
    this.data.note = `${this.data.note}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }
}
