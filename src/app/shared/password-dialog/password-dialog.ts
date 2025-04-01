import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApplicationState } from 'src/app/services/applicationstate';

export interface PasswordDialogData {
  password: string;
  action: string;
}

@Component({
  selector: 'password-dialog',
  templateUrl: 'password-dialog.html',
  styleUrls: ['password-dialog.css'],
  imports: [FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule],
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
