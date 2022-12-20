import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { ApplicationState } from './applicationstate.service';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(public appState: ApplicationState, public router: Router) {}
  canActivate(): boolean {
    if (!this.appState.authenticated) {
      this.router.navigate(['connect']);
      return false;
    }
    return true;
  }
}
