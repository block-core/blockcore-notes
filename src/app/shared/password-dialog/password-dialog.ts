import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApplicationState } from 'src/app/services/applicationstate';

export interface PasswordDialogData {
  password: string;
  action: string;
}

@Component({
  selector: 'password-dialog',
  templateUrl: 'password-dialog.html',
  styleUrls: ['password-dialog.css'],
})
export class PasswordDialog {
  publicKey?: string;

  constructor(private appState: ApplicationState, public dialogRef: MatDialogRef<PasswordDialogData>, @Inject(MAT_DIALOG_DATA) public data: PasswordDialogData) {
    this.publicKey = this.appState.getPublicKeyDisplay();
  }

  onNoClick(): void {
    this.data.password = '';
    this.dialogRef.close();
  }
}
