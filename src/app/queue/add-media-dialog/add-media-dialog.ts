import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AddMediaDialogData {
  url: string;
}

@Component({
  selector: 'add-media-dialog',
  templateUrl: 'add-media-dialog.html',
  styleUrls: ['add-media-dialog.css'],
})
export class AddMediaDialog {
  constructor(public dialogRef: MatDialogRef<AddMediaDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddMediaDialogData) {}

  onNoClick(): void {
    this.data.url = '';
    this.dialogRef.close();
  }
}
