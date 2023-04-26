import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { Nip76WebWalletStorage } from 'animiq-nip76-tools';
import { ApplicationState } from '../../services/applicationstate';
import { AuthenticationService, UserInfo } from '../../services/authentication';
import { Nip76Service } from '../nip76.service';

@Injectable()
export class Nip76DemoService implements CanActivate {
  constructor(
    public appState: ApplicationState,
    private authService: AuthenticationService,
    public router: Router,
    private nip76Service: Nip76Service
  ) {
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

  async createNip76Wallet(publicKey: string, privateKey: string) {

    // these Alice and Bob accounts are used for nip76 demostration only. they would not be needed in a final build
    if (publicKey === '6ea813a435667275c736d722261dc2516c14452c421342a1e6a42046d849c8b3') { //Alice
      localStorage.setItem(Nip76WebWalletStorage.backupKey, 'cec4LbCMhRCugybUHTqsZh97hzl6+eABGghHTWs/xO1Xyrx8KnDHQOc8yclbA35/Uz8TBqb5UohPRXZIeFRJj0AxxUw3Fpv2LcHA2gvyBIKpiwGdMIcq8fCzbFdEN7tb');
    } else if (publicKey === 'c94f40831616c246675a134f457e2a18db19570159e920dd62f91b66635982e1') { //Bob
      localStorage.setItem(Nip76WebWalletStorage.backupKey, 'wJAM+65IkkjXd3EyvITdSwv+o8NvAgB6NP+lM3JE5qoWoYjkod08XpTu4q5oRIZfYz4FQj4QEJo2Q6zKcOVPWbmtVAxsoQh6Jbj4KxV3+C9fClqY1RhDAYGJyocWiKYW');
    }

    this.nip76Service.wallet = await Nip76WebWalletStorage.fromStorage({ publicKey, privateKey });
    this.nip76Service.wallet.saveWallet(privateKey);
  }
}