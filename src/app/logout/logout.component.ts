import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
})
export class LogoutComponent {
  constructor(private appState: ApplicationState, private router: Router) {}

  ngOnInit() {
    this.appState.authenticated = false;
    this.appState.publicKeyHex = undefined;
    this.appState.publicKey = undefined;
    this.appState.short = undefined;

    localStorage.removeItem('blockcore:notes:nostr:pubkey');

    this.router.navigateByUrl('/connect');
  }
}
