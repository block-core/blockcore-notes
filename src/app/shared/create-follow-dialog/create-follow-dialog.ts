import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface FollowDialogData {
  pubkey: string;
}

@Component({
  selector: 'create-follow-dialog',
  templateUrl: 'create-follow-dialog.html',
  styleUrls: ['create-follow-dialog.scss'],
  imports: [MatFormFieldModule, MatIconModule, MatButtonModule, MatInputModule, FormsModule, MatDialogModule],
})
export class FollowDialog {
  constructor(public dialogRef: MatDialogRef<FollowDialogData>, @Inject(MAT_DIALOG_DATA) public data: FollowDialogData) {}

  onNoClick(): void {
    this.data.pubkey = '';
    this.dialogRef.close();
  }
}
