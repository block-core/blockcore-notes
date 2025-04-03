import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { base64 } from '@scure/base';
import { Relay, Event, utils, getPublicKey, nip19 } from 'nostr-tools';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from 'src/app/services/authentication';
import { ThemeService } from 'src/app/services/theme';
import { SecurityService } from 'src/app/services/security';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['../connect.css', './login.css'],
  imports: [MatIconModule, TranslateModule, MatCardModule, MatButtonModule, RouterModule, MatFormFieldModule, MatInputModule, FormsModule, CommonModule],
})
export class LoginComponent {
  privateKey: string = '';
  privateKeyHex: string = '';

  publicKey: string = '';
  publicKeyHex: string = '';

  password: string = '';
  error: string = '';
  readOnlyLogin = false;
  readOnlyKey = 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m';

  // hidePrivateKey = false;

  constructor(public translate: TranslateService, private authService: AuthenticationService, public theme: ThemeService, private router: Router, private security: SecurityService) {
    this.translate.use('en'); // This ensures translations are loaded
  }

  async connect() {
    const userInfo = await this.authService.login();

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  async anonymous(readOnlyKey?: string) {
    const userInfo = await this.authService.anonymous(readOnlyKey);

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  async persistKey() {
    // this.hidePrivateKey = true;

    setTimeout(async () => {
      if (!this.privateKeyHex) {
        return;
      }

      if (!this.publicKeyHex) {
        return;
      }

      // First attempt to get public key from the private key to see if it's possible:
      const encrypted = await this.security.encryptData(this.privateKeyHex, this.password);
      const decrypted = await this.security.decryptData(encrypted, this.password);

      if (this.privateKeyHex == decrypted) {
        localStorage.setItem('blockcore:notes:nostr:prvkey', encrypted);
        localStorage.setItem('blockcore:notes:nostr:pubkey', this.publicKeyHex);

        this.router.navigateByUrl('/');
      } else {
        this.error = 'Unable to encrypt and decrypt. Cannot continue.';
        console.error(this.error);
      }

      // this.hidePrivateKey = false;
    }, 10);
  }

  updatePublicKey() {
    this.error = '';
    this.publicKey = '';
    this.privateKeyHex = '';

    if (!this.privateKey) {
      this.publicKey = '';
      return;
    }

    if (this.privateKey.startsWith('npub')) {
      this.error = 'The key value must be a "nsec" value. You entered "npub", which is your public key.';
      return;
    }

    if (this.privateKey.startsWith('nsec')) {
      this.privateKeyHex = nip19.decode(this.privateKey).data as any;
    } else {
      this.privateKeyHex = this.privateKey;
    }

    try {
      this.publicKeyHex = getPublicKey(hexToBytes(this.privateKeyHex));
      this.publicKey = nip19.npubEncode(this.publicKeyHex);
    } catch (err: any) {
      this.error = err.message;
    }
  }
}
