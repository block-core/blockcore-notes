import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ProfileImageDialogData {
  picture: string;
}

@Component({
  selector: 'profile-image-dialog',
  templateUrl: 'profile-image-dialog.html',
  styleUrls: ['profile-image-dialog.scss'],
})
export class ProfileImageDialog {
  constructor(public dialogRef: MatDialogRef<ProfileImageDialogData>, @Inject(MAT_DIALOG_DATA) public data: ProfileImageDialogData) {}

  onNoClick(): void {
    this.data.picture = '';
    this.dialogRef.close();
  }
}
