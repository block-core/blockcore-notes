import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { base64 } from '@scure/base';
import { relayInit, Relay, Event, utils, getPublicKey, nip19 } from 'nostr-tools';

const enc = new TextEncoder();
const dec = new TextDecoder();

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

  constructor(private router: Router) {}

  async persistKey() {
    if (!this.privateKeyHex) {
      return;
    }

    if (!this.publicKeyHex) {
      return;
    }

    // First attempt to get public key from the private key to see if it's possible:
    const encrypted = await this.encryptData(this.privateKey, this.password);
    const decrypted = await this.decryptData(encrypted, this.password);

    if (this.privateKey == decrypted) {
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

  getPasswordKey(password: string) {
    return window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  }

  deriveKey(passwordKey: any, salt: any, keyUsage: any) {
    // TODO: Someone with better knowledge of cryptography should review our key sizes, iterations, etc.
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      keyUsage
    );
  }

  async encryptData(secretData: string, password: string) {
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const passwordKey = await this.getPasswordKey(password);
      const aesKey = await this.deriveKey(passwordKey, salt, ['encrypt']);
      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        enc.encode(secretData)
      );

      const encryptedContentArr = new Uint8Array(encryptedContent);
      let buff = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContentArr.byteLength);
      buff.set(salt, 0);
      buff.set(iv, salt.byteLength);
      buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);

      return base64.encode(buff);
    } catch (e) {
      console.error(e);
      return '';
    }
  }

  async decryptData(encryptedData: string, password: string) {
    try {
      const encryptedDataBuff = base64.decode(encryptedData);

      const salt = encryptedDataBuff.slice(0, 16);
      const iv = encryptedDataBuff.slice(16, 16 + 12);
      const data = encryptedDataBuff.slice(16 + 12);
      const passwordKey = await this.getPasswordKey(password.toString());
      const aesKey = await this.deriveKey(passwordKey, salt, ['decrypt']);
      const decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        data
      );
      return dec.decode(decryptedContent);
    } catch (e) {
      console.error(e);
      return '';
    }
  }
}
