import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ImportFollowDialogData {
  pubkey: string;
}

@Component({
  selector: 'import-follow-dialog',
  templateUrl: 'import-follow-dialog.html',
  styleUrls: ['import-follow-dialog.scss'],
})
export class ImportFollowDialog {
  constructor(public dialogRef: MatDialogRef<ImportFollowDialogData>, @Inject(MAT_DIALOG_DATA) public data: ImportFollowDialogData) {
    
  }

  onNoClick(): void {
    this.data.pubkey = '';
    this.dialogRef.close();
  }
}
