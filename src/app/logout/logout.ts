import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { AuthenticationService } from '../services/authentication';
import { StorageService } from '../services/storage';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.html',
})
export class LogoutComponent {
  constructor(private appState: ApplicationState, private db: StorageService, private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    this.db.close();
    this.authService.logout();
  }
}
