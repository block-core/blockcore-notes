import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HDKey, PrivateThread, Versions, Nip76Wallet, HDKissAddress, HDKissDocumentType, nip19Extension, IThreadPayload, PostDocument } from 'animiq-nip76-tools';
import { Event, getEventHash, signEvent, validateEvent } from 'nostr-tools';
import { BehaviorSubject } from 'rxjs';
import { PasswordDialog, PasswordDialogData } from '../shared/password-dialog/password-dialog';
import { DataService } from './data';
import { SecurityService } from './security';
``
const sessionKeyAddress = 'blockcore:notes:nostr:nip76:sessionKey';
const nostrPrivKeyAddress = 'blockcore:notes:nostr:prvkey';

@Injectable({
  providedIn: 'root'
})
export class Nip76Service {
  wallet: Nip76Wallet;
  privateThreads = new BehaviorSubject<PrivateThread[]>([]);
  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private security: SecurityService,
    private dataService: DataService
  ) {
    this.wallet = new Nip76Wallet();
    if (this.wallet.isInSession) {
      const sessionKey = sessionStorage.getItem(sessionKeyAddress);
      if (sessionKey) {
        if (this.wallet.readKey(sessionKey, 'session', '')) {
          this.initThreadProfiles();
        } else {
          sessionStorage.removeItem(sessionKeyAddress);
          this.wallet.clearSession();
        }
      } else {
        this.loadKeyFromPassword();
      }
    } else if (this.wallet.requiresLogin) {
      this.loadKeyFromPassword();
    }
  }
  private save(password: string) {
    this.wallet.saveKey(password, 'backup', false);
    const sessionKey = this.wallet.generateSessionKey();
    sessionStorage.setItem(sessionKeyAddress, sessionKey);
    this.wallet.saveKey(sessionKey, 'session', false);
  }
  async saveKeyWithPassword(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(PasswordDialog, {
        data: { action: 'Save Private Thread Keys', password: '' },
        maxWidth: '100vw',
        panelClass: 'full-width-dialog',
      });
      dialogRef.afterClosed().subscribe(async (result: PasswordDialogData) => {
        if (result) {
          const prvkeyEncrypted = localStorage.getItem(nostrPrivKeyAddress);
          const prvkey = await this.security.decryptData(prvkeyEncrypted!, result.password);
          if (prvkey) {
            this.save(prvkey);
            resolve(true);
          } else {
            this.snackBar.open(`Unable to decrypt data. Probably wrong password. Try again.`, 'Hide', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
            reject();
          }
        } else {
          reject();
        }
      });
    });
  }
  loadKeyFromPassword() {
    const dialogRef = this.dialog.open(PasswordDialog, {
      data: { action: 'Load Private Thread Keys', password: '' },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });
    dialogRef.afterClosed().subscribe(async (result: PasswordDialogData) => {
      if (result) {
        const prvkeyEncrypted = localStorage.getItem(nostrPrivKeyAddress);
        const prvkey = await this.security.decryptData(prvkeyEncrypted!, result.password);
        if (prvkey) {
          if (this.wallet.readKey(prvkey, 'backup', '')) {
            this.save(prvkey);
            this.initThreadProfiles();
          } else {
            this.snackBar.open(`Unable to decrypt nip76 data. Probably wrong password. Try again.`, 'Hide', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
          }
        } else {
          this.snackBar.open(`Unable to decrypt data. Probably wrong password. Try again.`, 'Hide', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
    });
  }
  private initThreadProfiles() {
    for (let i = 0; i < 10; i++) {
      this.wallet.getThread(i);
    }
    this.privateThreads.next(this.wallet.threads);
  }
  async updateThreadMetadata(thread: PrivateThread) {
    let event = this.dataService.createEventWithPubkey(17761, JSON.stringify(thread.p), thread.ap.publicKey.toString('hex'));
    thread!.p.created_at = event.created_at;
    event.content = JSON.stringify(thread.p);
    const signature = signEvent(event, thread.ap.privateKey.toString('hex')) as any;
    const signedEvent = event as Event;
    signedEvent.sig = signature;
    signedEvent.id = await getEventHash(event);
    await this.dataService.publishEvent(signedEvent);
    return true;
  }

  async saveNote(thread: PrivateThread, noteText: string) {
    const postDocument = PostDocument.default;
    postDocument.p = {
      message: noteText
    }
    const index = thread.p.last_known_index + 1;
    const ap = thread.indexMap.post.ap.deriveChildKey(index);
    const sp = thread.indexMap.post.sp.deriveChildKey(index);
    const address = new HDKissAddress({ publicKey: ap.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
    const encrypted = address.encrypt(JSON.stringify(postDocument.p), sp.publicKey, 1);
    let event = this.dataService.createEventWithPubkey(17761, encrypted, ap.publicKey.toString('hex'));
    const signature = signEvent(event, ap.privateKey.toString('hex')) as any;
    const signedEvent = event as Event;
    signedEvent.sig = signature;
    signedEvent.id = await getEventHash(event);
    await this.dataService.publishEvent(signedEvent);
    thread.p.last_known_index = index;
    await this.updateThreadMetadata(thread);
    return true;
  }
}
