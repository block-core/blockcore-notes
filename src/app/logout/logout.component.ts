import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { AuthenticationService } from '../services/authentication.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
})
export class LogoutComponent {
  constructor(private appState: ApplicationState, private db: StorageService, private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    this.db.close();
    this.authService.logout();
  }
}
