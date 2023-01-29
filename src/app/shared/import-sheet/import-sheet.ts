import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile';
import { RelayService } from 'src/app/services/relay';

@Component({
  selector: 'app-import-sheet',
  templateUrl: 'import-sheet.html',
})
export class ImportSheet {
  constructor(private relayService: RelayService, private router: Router, private profileService: ProfileService, @Inject(MAT_BOTTOM_SHEET_DATA) public data: any, private bottomSheetRef: MatBottomSheetRef<ImportSheet>) {}

  async import(event: MouseEvent) {
    this.bottomSheetRef.dismiss();
    event.preventDefault();

    if (this.data.relaysCount > 0) {
      // Reset all existing default connections.
      await this.relayService.deleteRelays();

      await this.relayService.appendRelays(this.data.relays);

      await this.relayService.connect();
    }

    const following = this.data.pubkeys;

    for (let i = 0; i < following.length; i++) {
      const publicKey = following[i];
      this.profileService.follow(publicKey);
    }

    setTimeout(() => {
      this.router.navigateByUrl('/people');
    }, 100);
  }
}
