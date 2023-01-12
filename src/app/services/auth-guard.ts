import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { ApplicationState } from './applicationstate';
import { AuthenticationService, UserInfo } from './authentication';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(public appState: ApplicationState, private authService: AuthenticationService, public router: Router) {}
  canActivate() {
    if (this.authService.authInfo$.getValue().authenticated()) {
      return true;
    }

    return this.authService.getAuthInfo().then((authInfo: UserInfo) => {
      if (authInfo.authenticated()) {
        return true;
      } else {
        this.router.navigateByUrl('/connect');
        return false;
      }
    });
  }
}
