import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { ApplicationState } from '../../services/applicationstate';
import { AuthenticationService, UserInfo } from '../../services/authentication';

@Injectable()
export class Nip76DemoAuthGuardService implements CanActivate {
  constructor(public appState: ApplicationState, private authService: AuthenticationService, public router: Router) {
    localStorage.setItem('blockcore:notes:nostr:consent', 'true');
  }
  canActivate() {
    if (this.authService.authInfo$.getValue().authenticated()) {
      return true;
    }

    return this.authService.getAuthInfo().then((authInfo: UserInfo) => {
      if (authInfo.authenticated()) {
        return true;
      } else {
        this.router.navigateByUrl('/private-channels/demo-setup');
        return false;
      }
    });
  }
}