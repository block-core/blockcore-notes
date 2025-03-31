import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface FollowDialogData {
  pubkey: string;
}

@Component({
  selector: 'create-follow-dialog',
  templateUrl: 'create-follow-dialog.html',
  styleUrls: ['create-follow-dialog.scss'],
  imports: [MatFormFieldModule, FormsModule, MatDialogModule],
})
export class FollowDialog {
  constructor(public dialogRef: MatDialogRef<FollowDialogData>, @Inject(MAT_DIALOG_DATA) public data: FollowDialogData) {}

  onNoClick(): void {
    this.data.pubkey = '';
    this.dialogRef.close();
  }
}
