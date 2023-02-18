import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventService } from 'src/app/services/event';
import { NostrEventDocument } from 'src/app/services/interfaces';

export interface ImportFollowDialogData {
  pubkey: string;
  pubkeys: string[];
  import: boolean;
}

@Component({
  selector: 'import-follow-dialog',
  templateUrl: 'import-follow-dialog.html',
  styleUrls: ['import-follow-dialog.scss'],
})
export class ImportFollowDialog {
  constructor(private eventService: EventService, public dialogRef: MatDialogRef<ImportFollowDialogData>, @Inject(MAT_DIALOG_DATA) public data: ImportFollowDialogData) {}

  onNoClick(): void {
    this.data.pubkey = '';
    this.dialogRef.close();
  }

  import() {
    this.data.import = true;
    this.dialogRef.close(this.data);
  }

  onFileSelected(event: any) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = () => {
      const event = JSON.parse(reader.result as string) as NostrEventDocument;
      const tags = this.eventService.pTags(event).map((v) => v[1]);

      this.data.pubkeys = tags;
      this.dialogRef.close(this.data);
    };
    reader.readAsText(file);
  }
}
