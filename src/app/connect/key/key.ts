import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { base64 } from '@scure/base';
import { relayInit, Relay, Event, utils, getPublicKey, nip19 } from 'nostr-tools';
import { SecurityService } from 'src/app/services/security';

@Component({
  selector: 'app-key',
  templateUrl: './key.html',
  styleUrls: ['../connect.css', './key.css'],
})
export class ConnectKeyComponent {
  privateKey: string = '';
  privateKeyHex: string = '';

  publicKey: string = '';
  publicKeyHex: string = '';

  password: string = '';
  error: string = '';

  constructor(private router: Router, private security: SecurityService) {}

  async persistKey() {
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
      this.publicKeyHex = getPublicKey(this.privateKeyHex);
      this.publicKey = nip19.npubEncode(this.publicKeyHex);
    } catch (err: any) {
      this.error = err.message;
    }
  }
}
