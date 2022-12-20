import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
})
export class ConnectComponent {
  constructor(private appState: ApplicationState, private router: Router) {}

  connect() {
    this.appState.authenticated = true;
    this.router.navigateByUrl('/');
  }
}
