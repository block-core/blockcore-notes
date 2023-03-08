import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AddThreadDialogData {
  threadPointer: string
}

@Component({
  selector: 'app-add-thread-dialog',
  templateUrl: './add-thread-dialog.component.html',
  styleUrls: ['./add-thread-dialog.component.scss']
})
export class AddThreadDialog {
  constructor(public dialogRef: MatDialogRef<AddThreadDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddThreadDialogData) {}

  onNoClick(): void {
    this.data.threadPointer = '';
    this.dialogRef.close();
  }
}
