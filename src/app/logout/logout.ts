import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { AuthenticationService } from '../services/authentication';
import { RelayService } from '../services/relay';
import { StorageService } from '../services/storage';
import { UIService } from '../services/ui';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.html',
})
export class LogoutComponent {
  constructor(private relayService: RelayService, private ui: UIService, private appState: ApplicationState, private db: StorageService, private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    // Make sure we terminate all the relays (and Web Workers).
    this.relayService.terminateAll();

    this.ui.clearAll();

    this.db.close();
    this.authService.logout();
  }
}
