import { NgZone } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { AuthenticationService } from '../services/authentication.service';
import { RelayService } from '../services/relay.service';
import { Utilities } from '../services/utilities.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css'],
})
export class ConnectComponent {
  extensionDiscovered = false;
  timeout: any;
  consent = false;

  constructor(private appState: ApplicationState, private relayService: RelayService, private authService: AuthenticationService, private utilities: Utilities, private router: Router, private ngZone: NgZone) {}

  async connect() {
    const userInfo = await this.authService.login();

    if (userInfo.authenticated()) {
      let relays;

      try {
        const gt = globalThis as any;
        relays = await gt.nostr.getRelays();
        console.log('RELAYS FROM EXTENSION:', relays);
      } catch (err) {
        relays = this.relayService.defaultRelays;
      }

      // First append whatever the extension give us of relays.
      await this.relayService.appendRelays(relays);

      // Initiate connections against registered relays.
      // this.relayService.connect();

      this.router.navigateByUrl('/');
    }
  }

  async anonymous() {
    const userInfo = await this.authService.anonymous();

    if (userInfo.authenticated()) {
      // First append whatever the extension give us of relays.
      await this.relayService.appendRelays(this.relayService.defaultRelays);

      // Initiate connections against registered relays.
      await this.relayService.connect();

      this.router.navigateByUrl('/');
    }
  }

  ngOnInit() {
    this.checkForExtension();
  }

  ngOnDestroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  checkForExtension() {
    const gt = globalThis as any;

    if (gt.nostr) {
      this.extensionDiscovered = true;
      return;
    }

    this.timeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.checkForExtension();
      });
    }, 250);
  }
}
