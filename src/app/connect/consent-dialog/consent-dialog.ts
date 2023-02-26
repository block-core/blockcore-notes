import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'add-consent-dialog',
  templateUrl: 'consent-dialog.html',
  styleUrls: ['consent-dialog.css'],
})
export class ConsentDialog {
  constructor(public dialogRef: MatDialogRef<boolean>, @Inject(MAT_DIALOG_DATA) public consent: boolean) {}

  onNoClick(): void {
    this.consent = false;
    this.dialogRef.close();
  }
}
