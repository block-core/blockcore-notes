import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AddRelayDialogData {
  url: string;
  read: boolean;
  write: boolean;
}

@Component({
  selector: 'add-relay-dialog',
  templateUrl: 'add-relay-dialog.html',
  styleUrls: ['add-relay-dialog.css'],
})
export class AddRelayDialog {
  constructor(public dialogRef: MatDialogRef<AddRelayDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddRelayDialogData) {}

  onNoClick(): void {
    this.data.url = '';
    this.dialogRef.close();
  }
}
