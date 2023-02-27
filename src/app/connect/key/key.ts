import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { base64 } from '@scure/base';
import { relayInit, Relay, Event, utils, getPublicKey, nip19, nip06 } from 'nostr-tools';
import { SecurityService } from '../../services/security';
import { ThemeService } from '../../services/theme';
import { QrScanDialog } from './qr-scan-dialog/qr-scan';

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
  step = 1;
  mnemonic: string = '';

  constructor(public dialog: MatDialog, public theme: ThemeService, private router: Router, private security: SecurityService) {}

  setPrivateKey() {
    this.privateKeyHex = nip06.privateKeyFromSeedWords(this.mnemonic);
    this.privateKey = nip19.nsecEncode(this.privateKeyHex);
    this.updatePublicKey();
  }

  ngOnDestroy() {
    this.reset();
  }

  reset() {
    this.privateKey = '';
    this.privateKeyHex = '';
    this.mnemonic = '';
    this.password = '';
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

        this.reset();

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
      this.publicKeyHex = getPublicKey(this.privateKeyHex);
      this.publicKey = nip19.npubEncode(this.publicKeyHex);
    } catch (err: any) {
      this.error = err.message;
    }
  }

  scanQrCode() {
    const dialogRef = this.dialog.open(QrScanDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.step = 3;

      try {
        if (result.startsWith('nostr:')) {
          result = result.replace('nostr:', '');
        }

        if (result.startsWith('nsec')) {
          const decoded = nip19.decode(result);
          this.privateKeyHex = decoded.data as string;
          this.privateKey = result;
        } else {
          this.privateKeyHex = result;
          this.privateKey = nip19.nsecEncode(result);
        }

        this.updatePublicKey();
      } catch (err: any) {
        this.error = 'Failed to scan.' + err.toString();
      }
    });
  }
}
