import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AddInvitationDialogData {
  channelPointer: string
}

@Component({
  selector: 'app-nip76-add-invitation',
  templateUrl: './nip76-add-invitation.component.html',
  styleUrls: ['./nip76-add-invitation.component.scss']
})
export class Nip76AddInvitationComponent {
  constructor(public dialogRef: MatDialogRef<AddInvitationDialogData>, @Inject(MAT_DIALOG_DATA) public data: AddInvitationDialogData) {}

  onNoClick(): void {
    this.data.channelPointer = '';
    this.dialogRef.close();
  }
}

