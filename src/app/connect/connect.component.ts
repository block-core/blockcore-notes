import { NgZone } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
})
export class ConnectComponent {
  extensionDiscovered = false;

  constructor(private appState: ApplicationState, private router: Router, private ngZone: NgZone) {}

  connect() {
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
