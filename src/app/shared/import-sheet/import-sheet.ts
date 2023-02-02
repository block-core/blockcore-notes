import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile';
import { RelayService } from 'src/app/services/relay';
import { sleep } from 'src/app/services/utilities';

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

      // Delete of relays can take some time, and if we append
      // right away, we might get terminate/disconnect event on the same relays
      // being re-added. We can either solve this by providing "do not delete" list
      // to the deleteRelays above, or implement some logic to wait for all relays to
      // fully terminate before we continue. Until then, let's sleep for 3 seconds as a temporary
      // fix for this issue.
      await sleep(1500);

      await this.relayService.appendRelays(this.data.relays);
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
