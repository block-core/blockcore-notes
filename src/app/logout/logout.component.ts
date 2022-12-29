import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { AuthenticationService } from '../services/authentication.service';
import { RelayStorageService } from '../services/relay.storage.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
})
export class LogoutComponent {
  constructor(private appState: ApplicationState, private relayStorage: RelayStorageService, private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    this.authService.logout();
  }
}
