import { NgZone } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
})
export class ConnectComponent {
  extensionDiscovered = false;

  constructor(private appState: ApplicationState, private utilities: Utilities, private router: Router, private ngZone: NgZone) {}

  async connect() {
    const gt = globalThis as any;

    const publicKey = await gt.nostr.getPublicKey();
    this.appState.publicKeyHex = publicKey;
    this.appState.publicKey = this.utilities.getNostrIdentifier(publicKey);
    this.appState.short = this.appState.publicKey.substring(0, 10) + '...'; // TODO: Figure out a good way to minimize the public key, "5...5"?

    localStorage.setItem('blockcore:notes:nostr:pubkey', publicKey);

    this.appState.authenticated = true;
    this.router.navigateByUrl('/');
  }

  ngOnInit() {
    this.checkForExtension();
  }

  checkForExtension() {
    const gt = globalThis as any;

    if (gt.nostr) {
      this.extensionDiscovered = true;
      return;
    }

    setTimeout(() => {
      this.ngZone.run(() => {
        this.checkForExtension();
      });
    }, 250);
  }
}
