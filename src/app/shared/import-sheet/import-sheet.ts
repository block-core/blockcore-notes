import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-import-sheet',
  templateUrl: 'import-sheet.html',
})
export class ImportSheet {
  constructor(private bottomSheetRef: MatBottomSheetRef<ImportSheet>) {}

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
  }
}
