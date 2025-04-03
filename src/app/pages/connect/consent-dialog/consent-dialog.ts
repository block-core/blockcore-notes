import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'add-consent-dialog',
  templateUrl: 'consent-dialog.html',
  styleUrls: ['consent-dialog.css'],
  imports: [MatDialogModule, MatButtonModule],
})
export class ConsentDialog {
  constructor(public dialogRef: MatDialogRef<boolean>, @Inject(MAT_DIALOG_DATA) public consent: boolean) {}

  onNoClick(): void {
    this.consent = false;
    this.dialogRef.close();
  }
}
