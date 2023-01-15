import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { ProfileService } from 'src/app/services/profile';

@Component({
  selector: 'app-import-sheet',
  templateUrl: 'import-sheet.html',
})
export class ImportSheet {
  constructor(private profileService: ProfileService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: any, private bottomSheetRef: MatBottomSheetRef<ImportSheet>) {}

  import(event: MouseEvent): void {
    this.bottomSheetRef.dismiss();
    event.preventDefault();
    const following = this.data.pubkeys;

    for (let i = 0; i < following.length; i++) {
      const publicKey = following[i];
      this.profileService.follow(publicKey);
    }
  }
}
