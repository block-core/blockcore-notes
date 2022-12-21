import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(public appState: ApplicationState, private utilities: Utilities, private router: Router) {}

  async ngOnInit() {
    const publicKey = localStorage.getItem('blockcore:notes:nostr:pubkey');

    if (publicKey) {
      this.appState.publicKeyHex = publicKey;
      this.appState.publicKey = this.utilities.getNostrIdentifier(publicKey);
      this.appState.short = this.appState.publicKey.substring(0, 10) + '...'; // TODO: Figure out a good way to minimize the public key, "5...5"?
      this.appState.authenticated = true;
    }

    // TODO: Initialize of extension can take time, first load we wait longer to see if extension is there. After
    // initial verification that user has extension (this happens on Connect component), then we persist some state
    // and assume extension is approve (when we have pubkey available).
    if (this.appState.authenticated) {
      // this.router.navigateByUrl('/notes');
    } else {
      this.router.navigateByUrl('/connect');
    }
  }
}
