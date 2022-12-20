import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
})
export class LogoutComponent {
  constructor(private appState: ApplicationState, private router: Router) {
    this.appState.authenticated = false;
  }

  ngOnInit() {
    this.router.navigateByUrl('/connect');
  }
}
