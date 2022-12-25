import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Circle } from 'src/app/services/interfaces';

@Component({
  selector: 'create-circle-dialog',
  templateUrl: 'create-circle-dialog.html',
  styleUrls: ['create-circle-dialog.scss'],
})
export class CircleDialog {
  constructor(public dialogRef: MatDialogRef<CircleDialog>, @Inject(MAT_DIALOG_DATA) public data: Circle) {
    this.dialogRef.updateSize('50%');
    this.dialogRef.updatePosition({ top: '50px' });

    this.data.name = '';
    this.data.color = '#673ab7';
  }

  onNoClick(): void {
    this.data.name = '';
    this.data.color = '#673ab7';
    this.dialogRef.close();
  }

}
