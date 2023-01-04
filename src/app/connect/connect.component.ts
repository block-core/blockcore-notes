import { ChangeDetectorRef, NgZone } from '@angular/core';
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
  consent: boolean = false;

  constructor(
    private appState: ApplicationState,
    private cd: ChangeDetectorRef,
    private relayService: RelayService,
    private authService: AuthenticationService,
    private utilities: Utilities,
    private router: Router,
    private ngZone: NgZone
  ) {}

  persist() {
    localStorage.setItem('blockcore:notes:nostr:consent', this.consent.toString());
  }

  async connect() {
    const userInfo = await this.authService.login();

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  async anonymous() {
    const userInfo = await this.authService.anonymous();

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  ngOnInit() {
    this.consent = localStorage.getItem('blockcore:notes:nostr:consent') === 'true';
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
