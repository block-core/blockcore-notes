import { NgZone } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { AuthenticationService } from '../services/authentication.service';
import { Utilities } from '../services/utilities.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css'],
})
export class ConnectComponent {
  extensionDiscovered = false;
  timeout: any;

  constructor(private appState: ApplicationState, private authService: AuthenticationService, private utilities: Utilities, private router: Router, private ngZone: NgZone) {}

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
