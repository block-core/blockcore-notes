import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Utilities } from './utilities';

export class UserInfo {
  publicKey?: string;

  publicKeyHex?: string;

  short?: string;

  authenticated() {
    return !!this.publicKeyHex;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  static UNKNOWN_USER = new UserInfo();

  authInfo$: BehaviorSubject<UserInfo> = new BehaviorSubject<UserInfo>(AuthenticationService.UNKNOWN_USER);

  constructor(private utilities: Utilities, private router: Router) {}

  async login() {
    const gt = globalThis as any;

    const publicKey = await gt.nostr.getPublicKey();
    const user = this.createUser(publicKey);

    localStorage.setItem('blockcore:notes:nostr:pubkey', publicKey);

    this.authInfo$.next(user);
    return user;
  }

  anonymous(readOnlyKey?: string) {
    if (readOnlyKey) {
      readOnlyKey = this.utilities.ensureHexIdentifier(readOnlyKey);
    }

    const publicKey = readOnlyKey || '354faab36ca511a7956f0bfc2b64e06fe5395cd7208d9b65d6665270298743d8';
    const user = this.createUser(publicKey);
    localStorage.setItem('blockcore:notes:nostr:pubkey', publicKey);

    this.authInfo$.next(user);
    return user;
  }

  logout() {
    localStorage.removeItem('blockcore:notes:nostr:pubkey');
    localStorage.removeItem('blockcore:notes:nostr:prvkey');
    this.authInfo$.next(AuthenticationService.UNKNOWN_USER);
    this.router.navigateByUrl('/connect');
  }

  private createUser(publicKey: string) {
    const user = new UserInfo();
    user.publicKeyHex = publicKey;
    user.publicKey = this.utilities.getNostrIdentifier(publicKey);
    user.short = publicKey.substring(0, 10) + '...'; // TODO: Figure out a good way to minimize the public key, "5...5"?
    return user;
  }

  async getAuthInfo() {
    let publicKey = localStorage.getItem('blockcore:notes:nostr:pubkey');

    if (publicKey) {
      try {
        this.utilities.getNostrIdentifier(publicKey);
      } catch (err) {
        // If we cannot parse the public key, reset the storage.
        publicKey = '';
        localStorage.setItem('blockcore:notes:nostr:pubkey', '');
        return AuthenticationService.UNKNOWN_USER;
      }

      const user = this.createUser(publicKey);
      this.authInfo$.next(user);
      return user;
    } else {
      this.authInfo$.next(AuthenticationService.UNKNOWN_USER);
      return AuthenticationService.UNKNOWN_USER;
    }
  }
}
