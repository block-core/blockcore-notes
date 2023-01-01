import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FollowDialogData {
  pubkey: string;
}

@Component({
  selector: 'create-follow-dialog',
  templateUrl: 'create-follow-dialog.html',
  styleUrls: ['create-follow-dialog.scss'],
})
export class FollowDialog {
  constructor(public dialogRef: MatDialogRef<FollowDialogData>, @Inject(MAT_DIALOG_DATA) public data: FollowDialogData) {}

  onNoClick(): void {
    this.data.pubkey = '';
    this.dialogRef.close();
  }
}
