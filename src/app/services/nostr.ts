import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getEventHash, getPublicKey, signEvent, validateEvent } from 'nostr-tools';
import { PasswordDialog, PasswordDialogData } from '../shared/password-dialog/password-dialog';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { SecurityService } from './security';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class NostrService {
  /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
  defaultRelays: any = {
    // 'wss://nostr-pub.wellorder.net': { read: true, write: true },
    // 'wss://relay.nostr.ch': { read: true, write: true },
    // 'wss://relay.damus.io': { read: true, write: true },
    'wss://relay.plebstr.com': { read: true, write: true },
    'wss://relay.nostr.info': { read: true, write: true },
    // 'wss://e.nos.lol': { read: true, write: true },
    'wss://nos.lol': { read: true, write: true },
    'wss://relay.nostr.wirednet.jp': { read: true, write: true },
    'wss://relay.damus.io': { read: true, write: true },
    'wss://nostr.mom': { read: true, write: true },
    'wss://relay.snort.social': { read: true, write: true },
    'wss://relay.nostr.bg': { read: true, write: true },
    'wss://nostr.fmt.wiz.biz': { read: true, write: true },
  };

  constructor(public dialog: MatDialog, private snackBar: MatSnackBar, private security: SecurityService) {}

  async sign(event: any) {
    let prvkeyEncrypted = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkeyEncrypted) {
      const gt = globalThis as any;

      // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
      return gt.nostr.signEvent(event);
    } else {
      return new Promise((resolve, reject) => {
        const dialogRef = this.dialog.open(PasswordDialog, {
          data: { action: 'Sign', password: '' },
          maxWidth: '100vw',
          panelClass: 'full-width-dialog',
        });

        dialogRef.afterClosed().subscribe(async (result: PasswordDialogData) => {
          if (!result) {
            reject();
            return;
          }

          const prvkey = await this.security.decryptData(prvkeyEncrypted!, result.password);

          if (!prvkey) {
            this.snackBar.open(`Unable to decrypt data. Probably wrong password. Try again.`, 'Hide', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
            reject(`Unable to decrypt data. Probably wrong password.`);
            return;
          }

          const pubkey = getPublicKey(prvkey);

          if (event.pubkey != pubkey) {
            reject('The event public key is not correct for this private key');
          }

          if (!event.id) event.id = await getEventHash(event);
          if (!validateEvent(event)) {
            reject('Invalid Nostr event.');
          }

          const signature = signEvent(event, prvkey) as any;
          event.sig = signature;

          resolve(event);
        });
      });
    }
  }

  async relays() {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkey) {
      try {
        const gt = globalThis as any;
        const relays = gt.nostr.getRelays();
        return relays;
      } catch (err) {
        return this.defaultRelays;
      }
    } else {
      return this.defaultRelays;
    }
  }

  async decrypt(pubkey: string, content: string) {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkey) {
      const gt = globalThis as any;
      const decrypted = await gt.nostr.nip04.decrypt(pubkey, content);
      return decrypted;
    } else {
      throw new Error('Private key based decrypt not implemented yet.');
    }
  }

  async encrypt(pubkey: string, content: string) {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkey) {
      const gt = globalThis as any;
      const decrypted = await gt.nostr.nip04.encrypt(pubkey, content);
      return decrypted;
    } else {
      throw new Error('Private key based encrypt not implemented yet.');
    }
  }
}
