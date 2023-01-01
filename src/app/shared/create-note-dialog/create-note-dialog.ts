import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface NoteDialogData {
  note: string;
}

@Component({
  selector: 'create-note-dialog',
  templateUrl: 'create-note-dialog.html',
  styleUrls: ['create-note-dialog.scss'],
})
export class NoteDialog {
  isEmojiPickerVisible: boolean | undefined;

  constructor(public dialogRef: MatDialogRef<NoteDialog>, @Inject(MAT_DIALOG_DATA) public data: NoteDialogData) {
    this.data.note = '';
  }

  onNoClick(): void {
    this.data.note = '';
    this.dialogRef.close();
  }

  public addEmoji(event: { emoji: { native: any } }) {
    this.data.note = `${this.data.note}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }

  largeSize = false;

  toggleSize() {
    if (this.largeSize) {
      this.dialogRef.updateSize('auto', 'auto');
    } else {
      this.dialogRef.updateSize('100vw', '100vh');
    }

    this.largeSize = !this.largeSize;

    // .full-width-dialog {
    //   max-width: 100vw !important;
    //   height: 100%;
    //   width: 100%;
    //   min-width: 0;
    // }
  }
}
