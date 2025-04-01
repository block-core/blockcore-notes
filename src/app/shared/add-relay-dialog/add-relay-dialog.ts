import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';

export interface AddRelayDialogData {
  url: string;
  read: boolean;
  write: boolean;
}

@Component({
  selector: 'add-relay-dialog',
  templateUrl: 'add-relay-dialog.html',
  styleUrls: ['add-relay-dialog.css'],
  imports: [MatFormFieldModule, MatButtonModule, MatInputModule, MatSlideToggleModule, FormsModule, TranslateModule, MatDialogModule],
})
export class AddRelayDialog {
  constructor(public dialogRef: MatDialogRef<AddRelayDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddRelayDialogData) {}

  onNoClick(): void {
    this.data.url = '';
    this.dialogRef.close();
  }
}
