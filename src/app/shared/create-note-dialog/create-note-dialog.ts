import {Component, Inject} from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';


export interface NoteDialogData {
  note: string;
}

@Component({
  selector: 'create-note-dialog',
  templateUrl: 'create-note-dialog.html',
  styleUrls: ['create-note-dialog.scss']
})
export class NoteDialog {
  constructor(public dialogRef: MatDialogRef<NoteDialog>, @Inject(MAT_DIALOG_DATA) public data: NoteDialogData) {
    this.dialogRef.updateSize('70%');
    this.dialogRef.updatePosition({ top: '50px'});

    this.data.note = '';
  }

  onNoClick(): void {
    this.data.note = '';
    this.dialogRef.close();
  }

  public isEmojiPickerVisible: boolean | undefined;
  public addEmoji(event: { emoji: { native: any; }; }) {
    this.data.note = `${this.data.note}${event.emoji.native}`;
     this.isEmojiPickerVisible = false;
  }

}
