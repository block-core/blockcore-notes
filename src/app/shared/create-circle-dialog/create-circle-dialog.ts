import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApplicationState } from 'src/app/services/applicationstate';
import { Circle } from 'src/app/services/interfaces';
import { circleStyles } from '../defaults';

@Component({
  selector: 'create-circle-dialog',
  templateUrl: 'create-circle-dialog.html',
  styleUrls: ['create-circle-dialog.scss'],
})
export class CircleDialog {
  styles = circleStyles;

  constructor(private appState: ApplicationState, public dialogRef: MatDialogRef<CircleDialog>, @Inject(MAT_DIALOG_DATA) public data: Circle) {
    this.data.name = '';
    this.data.color = '#673ab7';
  }

  onNoClick(): void {
    this.data.name = '';
    this.data.color = '#673ab7';
    this.dialogRef.close();
  }
}
