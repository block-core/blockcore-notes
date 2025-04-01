import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface AddMediaDialogData {
  url: string;
}

@Component({
  selector: 'add-media-dialog',
  templateUrl: 'add-media-dialog.html',
  styleUrls: ['add-media-dialog.css'],
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatDialogModule],
})
export class AddMediaDialog {
  constructor(public dialogRef: MatDialogRef<AddMediaDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddMediaDialogData) {}

  onNoClick(): void {
    this.data.url = '';
    this.dialogRef.close();
  }
}
