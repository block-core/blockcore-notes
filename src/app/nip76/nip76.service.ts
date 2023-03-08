import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HDKey, HDKissAddress, HDKissDocumentType, IThreadPayload, nip19Extension, Nip76Wallet, PostDocument, PrivateThread, Versions } from 'animiq-nip76-tools';
import { Event, getEventHash, signEvent } from 'nostr-tools';
import { Subject } from 'rxjs';
import { DataService } from '../services/data';
import { NostrEvent, NostrProfileDocument, NostrRelaySubscription } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { RelayService } from '../services/relay';
import { SecurityService } from '../services/security';
import { PasswordDialog, PasswordDialogData } from '../shared/password-dialog/password-dialog';
import { AddThreadDialog, AddThreadDialogData } from './add-thread-dialog/add-thread-dialog.component';

const sessionKeyAddress = 'blockcore:notes:nostr:nip76:sessionKey';
const nostrPrivKeyAddress = 'blockcore:notes:nostr:prvkey';

interface PrivateThreadWithRelaySub extends PrivateThread {
  sub?: NostrRelaySubscription;
}

@Injectable({
  providedIn: 'root'
})
export class Nip76Service {

  wallet: Nip76Wallet;
  profile!: NostrProfileDocument;
  threads: PrivateThreadWithRelaySub[] = [];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private security: SecurityService,
    private profileService: ProfileService,
    private relayService: RelayService,
    private dataService: DataService
  ) {
    this.profileService.profile$.subscribe((profile) => {
      this.profile = profile!;
    });
    this.wallet = new Nip76Wallet();
    if (this.wallet.isInSession) {
      const sessionKey = sessionStorage.getItem(sessionKeyAddress);
      if (sessionKey) {
        if (this.wallet.readKey(sessionKey, 'session', '')) {
          this.initWalletThreads();
        } else {
          sessionStorage.removeItem(sessionKeyAddress);
          this.wallet.clearSession();
        }
      } else {
        this.login();
      }
    } else if (this.wallet.requiresLogin) {
      this.login();
    }
  }

  private async passwordDialog(actionPrompt: string, onSuccess: (key: string) => void): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(PasswordDialog, {
        data: { action: actionPrompt, password: '' },
        maxWidth: '100vw',
        panelClass: 'full-width-dialog',
      });
      dialogRef.afterClosed().subscribe(async (result: PasswordDialogData) => {
        if (result) {
          const prvkeyEncrypted = localStorage.getItem(nostrPrivKeyAddress);
          const prvkey = await this.security.decryptData(prvkeyEncrypted!, result.password);
          if (prvkey) {
            onSuccess.apply(this, [prvkey]);
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

  private initWalletThreads() {
    for (let i = 0; i < 10; i++) {
      this.wallet.getThread(i);
      this.wallet.threads[i].ownerPubKey = this.profile.pubkey;
    }
    this.threads = [...this.threads, ...this.wallet.threads];
    this.loadThreads();
  }

  private saveWallet(password: string) {
    this.wallet.saveKey(password, 'backup', false);
    const sessionKey = this.wallet.generateSessionKey();
    sessionStorage.setItem(sessionKeyAddress, sessionKey);
    this.wallet.saveKey(sessionKey, 'session', false);
    this.wallet.isInSession = true;
    this.initWalletThreads();
  }

  private loadWallet(password: string) {
    if (this.wallet.readKey(password, 'backup', '')) {
      this.saveWallet(password);
    }
  }

  async previewThread(): Promise<PrivateThreadWithRelaySub> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(AddThreadDialog, {
        data: { threadPointer: '' },
        maxWidth: '200vw',
        panelClass: 'full-width-dialog',
      });
      dialogRef.afterClosed().subscribe(async (result: AddThreadDialogData) => {
        if (result?.threadPointer) {
          const pointer = nip19Extension.decode(result.threadPointer);
          if (pointer) {
            const thread = PrivateThread.fromPointer(pointer.data as nip19Extension.SecureThreadPointer);
            this.threads = [...this.threads];
            const threadIndex = this.threads.findIndex(x => x.a == thread.a);
            if (threadIndex === -1) {
              this.threads.push(thread);
            } else {
              if(this.threads[threadIndex].sub){
                this.relayService.unsubscribe(this.threads[threadIndex].sub!.id);
              }
              this.threads[threadIndex] = thread;
            }
            this.loadThreads();
            this.loadNotes(thread);
            resolve(thread);
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

  async save(): Promise<boolean> {
    return this.passwordDialog('Save Private Thread Keys', this.saveWallet);
  }

  async login(): Promise<boolean> {
    return this.passwordDialog('Load Private Thread Keys', this.loadWallet);
  }

  async logout() {
    sessionStorage.removeItem(sessionKeyAddress);
    this.wallet.clearSession();
    this.wallet = new Nip76Wallet();
  }

  private loadThreadsSubId = ''

  loadThreads() {
    if (this.threads.length) {
      if (this.loadThreadsSubId) {
        this.relayService.unsubscribe(this.loadThreadsSubId);
      }
      const privateThreads$ = new Subject<NostrEvent>();
      privateThreads$.subscribe(nostrEvent => {
        const thread = this.threads.find(x => nostrEvent.pubkey === x.ap.publicKey.slice(1).toString('hex'));
        if (thread) {
          thread.p = JSON.parse(nostrEvent.content) as IThreadPayload;
          thread.ready = true;
        }
      });
      const threadPubKeys = this.threads.map(x => x.ap.publicKey.slice(1).toString('hex'));
      this.loadThreadsSubId = this.relayService.subscribe([{
        authors: threadPubKeys,
        kinds: [17761],
        limit: 100
      }], `nip76Service.loadThreads`, 'Replaceable', privateThreads$).id;
    }
  }

  loadNotes(thread: PrivateThreadWithRelaySub | undefined, indexStart = 0) {
    if (thread) {
      if (thread.sub) {
        this.relayService.unsubscribe(thread.sub.id);
      }
      const privateNotes$ = new Subject<NostrEvent>();
      privateNotes$.subscribe(nostrEvent => {
        let keyIndex = 0;
        let ap: HDKey;
        let sp: HDKey | undefined;
        for (let i = indexStart; i < indexStart + 10; i++) {
          ap = thread!.indexMap.post.ap.deriveChildKey(i);
          if (nostrEvent.pubkey === ap.publicKey.slice(1).toString('hex')) {
            keyIndex = i;
            sp = thread!.indexMap.post.sp.deriveChildKey(i);
            break;
          }
        }
        if (sp) {
          const postIndex = thread.posts.findIndex(x => x.h === nostrEvent.id);
          if (postIndex === -1 || thread.posts[postIndex].t < nostrEvent.created_at) {
            const post = PostDocument.default;
            post.setKeys(ap!, sp!);
            post.address = new HDKissAddress({ publicKey: ap!.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
            post.thread = thread;
            post.s = nostrEvent.sig;
            post.h = nostrEvent.id;
            post.a = post.a = post.address.value;
            post.v = 3;
            post.e = nostrEvent.content;
            post.i = keyIndex;
            post.t = nostrEvent.created_at;
            // thread?.indexMap.post.decrypt(post);
            const decrypted = post.address.decrypt(post.e, sp.publicKey, post.v);
            post.p = JSON.parse(decrypted);
            if (post.p) nostrEvent.content = post.p.message!;
            post.ownerPubKey = thread.ownerPubKey;
            post.nostrEvent = nostrEvent;
            // console.log(`decrypt - ${post.nostrEvent.content.substring(0,10)}`, Array.from(sp.publicKey))
            if (postIndex === -1) {
              thread.posts.push(post);
            } else {
              thread.posts[postIndex] = post;
            }
            thread.posts = thread.posts.sort((a, b) => b.t - a.t);
          }
        }
      });

      const notePubKeys: string[] = [];
      for (let i = indexStart; i < indexStart + 10; i++) {
        const ap = thread.indexMap.post.ap.deriveChildKey(i);
        notePubKeys.push(ap.publicKey.slice(1).toString('hex'));
      }
      thread.sub = this.relayService.subscribe([{
        authors: notePubKeys,
        kinds: [17761],
        limit: 100
      }], `nip76Service.loadNotes.${thread.a}`, 'Replaceable', privateNotes$);
    }
  }

  async updateThreadMetadata(thread: PrivateThreadWithRelaySub) {
    let event = this.dataService.createEventWithPubkey(17761, JSON.stringify(thread.p), thread.ap.publicKey.slice(1).toString('hex'));
    thread!.p.created_at = event.created_at;
    event.content = JSON.stringify(thread.p);
    const signature = signEvent(event, thread.ap.privateKey.toString('hex')) as any;
    const signedEvent = event as Event;
    signedEvent.sig = signature;
    signedEvent.id = await getEventHash(event);
    await this.dataService.publishEvent(signedEvent);
    return true;
  }

  async saveNote(thread: PrivateThreadWithRelaySub, noteText: string) {
    const postDocument = PostDocument.default;
    postDocument.p = {
      message: noteText
    }
    const index = thread.p.last_known_index + 1;
    const ap = thread.indexMap.post.ap.deriveChildKey(index);
    const sp = thread.indexMap.post.sp.deriveChildKey(index);
    const address = new HDKissAddress({ publicKey: ap.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
    const encrypted = address.encrypt(JSON.stringify(postDocument.p), sp.publicKey, 1);
    let event = this.dataService.createEventWithPubkey(17761, encrypted, ap.publicKey.slice(1).toString('hex'));
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
