import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApplicationState } from 'src/app/services/applicationstate';

export interface PasswordDialogData {
  password: string;
  action: string;
}

@Component({
    selector: 'password-dialog',
    templateUrl: 'password-dialog.html',
    styleUrls: ['password-dialog.css'],
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      MatDialogModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule
    ]
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
