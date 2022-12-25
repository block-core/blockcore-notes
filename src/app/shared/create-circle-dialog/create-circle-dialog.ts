import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface CircleDialogData {
  note: string;
}

@Component({
  selector: 'create-circle-dialog',
  templateUrl: 'create-circle-dialog.html',
  styleUrls: ['create-circle-dialog.scss'],
})
export class CircleDialog {
  constructor(public dialogRef: MatDialogRef<CircleDialog>, @Inject(MAT_DIALOG_DATA) public data: CircleDialogData) {
    this.dialogRef.updateSize('80%');
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
