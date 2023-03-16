import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as secp256k1 from '@noble/secp256k1';
import { HDKey, nip19Extension, Nip76Wallet, PostDocument, PrivateThread } from 'animiq-nip76-tools';
import * as nostrTools from 'nostr-tools';
import { Event, getEventHash, signEvent } from 'nostr-tools';
import { Subject } from 'rxjs';
import { DataService } from '../services/data';
import { NostrEvent, NostrRelaySubscription } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { RelayService } from '../services/relay';
import { SecurityService } from '../services/security';
import { UIService } from '../services/ui';
import { PasswordDialog, PasswordDialogData } from '../shared/password-dialog/password-dialog';
import { AddThreadDialog, AddThreadDialogData } from './add-thread-dialog/add-thread-dialog.component';

const nostrPrivKeyAddress = 'blockcore:notes:nostr:prvkey';

interface PrivateThreadWithRelaySub extends PrivateThread {
  threadSubscription?: NostrRelaySubscription;
  notesSubscription?: NostrRelaySubscription;
  followingSubscription?: NostrRelaySubscription;
}

interface PostDocumentWithRelaySub extends PostDocument {
  reactionSubscription?: NostrRelaySubscription;
}

@Injectable({
  providedIn: 'root'
})
export class Nip76Service {

  wallet = Nip76Wallet.create();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private security: SecurityService,
    private profileService: ProfileService,
    private relayService: RelayService,
    private dataService: DataService,
    private ui: UIService
  ) {
    Nip76Wallet.fromStorage().then(wallet => {
      this.wallet = wallet;
      this.profileService.profile$.subscribe((profile) => {
        this.wallet.ownerPubKey = profile!.pubkey;
        if (this.wallet.isInSession) {
          [...Array(wallet.threads.length + 2)].forEach((_, i) => wallet.getThread(i));
          this.loadThread(wallet.threads[0]);
        } else if (this.wallet.requiresLogin) {
          this.login();
        }
      });
    });
  }

  private async passwordDialog(actionPrompt: string): Promise<string> {
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
            resolve(prvkey);
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

  async saveWallet(): Promise<boolean> {
    const privateKey = await this.passwordDialog('Save Private Thread Keys');
    await this.wallet.saveWallet(privateKey);
    return true;
  }

  async login(): Promise<boolean> {
    const privateKey = await this.passwordDialog('Load Private Thread Keys');
    if (await this.wallet.readKey(privateKey, 'backup', '')) {
      [...Array(this.wallet.threads.length + 2)].forEach((_, i) => this.wallet.getThread(i));
      this.loadThread(this.wallet.threads[0]);
      await this.wallet.saveWallet(privateKey);
      return true;
    }
    return false;
  }

  async logout() {
    const ownerPubKey = this.wallet.ownerPubKey;
    this.wallet.clearSession();
    this.wallet = await Nip76Wallet.fromStorage();
    this.wallet.ownerPubKey = ownerPubKey;
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
          const following = await this.loadFollowing(result.threadPointer, '');
          if (following) {
            resolve(following);
          } else {
            reject();
          }
        } else {
          reject();
        }
      });
    });
  }

  loadThread(thread: PrivateThreadWithRelaySub, startIndex = 0, length = 20) {
    if (thread.threadSubscription) {
      this.relayService.unsubscribe(thread.threadSubscription.id);
    }
    const privateThreads$ = new Subject<NostrEvent>();
    privateThreads$.subscribe(async nostrEvent => {
      const fthread = this.findThread(nostrEvent.pubkey);
      if (fthread) {
        if (await fthread?.indexMap.post.decrypt(fthread, nostrEvent)) {
          if (fthread.ownerPubKey === this.wallet.ownerPubKey) {
            this.loadFollowings(fthread as PrivateThreadWithRelaySub);
          }
        }
      } else if (!nostrEvent.tags[0]) {
        const post = thread.posts.find(x => x.ap.nostrPubKey === nostrEvent.pubkey);
        if (post) {
          await thread.indexMap.post.decrypt(post, nostrEvent);
          nostrEvent.content = post.content?.text! || nostrEvent.content;
        }
      } else if (nostrEvent.tags[0][0] === 'e') {
        const post = thread.posts.find(x => x.rp.nostrPubKey === nostrEvent.tags[0][1])!;
        if (post) {
          const reply = new PostDocument();
          reply.nostrEvent = nostrEvent;
          reply.index = nostrEvent.created_at - post.nostrEvent.created_at;
          await post.reactionsIndex.decrypt(reply, nostrEvent);
          if (reply.content) {
            const coll = reply.content.kind === nostrTools.Kind.Text ? post.replies : post.reactions;
            const collIndex = coll.findIndex(x => x.nostrEvent?.id === nostrEvent.id);
            if (collIndex === -1) {
              coll.push(reply);
              if (reply.content.kind === nostrTools.Kind.Text) {
                post.replies = post.replies.sort((a, b) => b.nostrEvent.created_at - a.nostrEvent.created_at);
                nostrEvent.content = reply.content.text;
                // this.loadReactions(post.replies)
              } else {
                const count = post.reactionTracker[reply.content.text!];
                post.reactionTracker[reply.content.text!] = count ? count + 1 : 1;
              }
            } else {
              coll[collIndex] = reply;
            }
          }
        }
      }
    });
    thread.threadSubscription = this.relayService.subscribe(
      thread.getRelayFilter(startIndex, length),
      `nip76Service.loadThread.${thread.ap.nostrPubKey}`, 'Replaceable', privateThreads$
    );
  }

  findThread(pubkey: string): PrivateThreadWithRelaySub | undefined {
    let thread = this.wallet.threads.find(x => pubkey === x.ap.nostrPubKey);
    if (!thread) {
      thread = this.wallet.following.find(x => pubkey === x.ap.nostrPubKey);
    }
    return thread;
  }

  private async loadFollowing(threadPointer: string, secret: string | Uint8Array[]) {
    const pointer = await nip19Extension.decode(threadPointer, secret);
    if (pointer) {
      const thread = PrivateThread.fromPointer(pointer.data as nip19Extension.PrivateThreadPointer);
      if (thread.ownerPubKey === this.wallet.ownerPubKey) {
        const message = 'Self owned threads should only be initialized from the wallet directly.';
        this.snackBar.open(message, 'Hide', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        return undefined;
      }
      const threadIndex = this.wallet.following.findIndex(x => x.ap.nostrPubKey == thread.ap.nostrPubKey);
      if (threadIndex === -1) {
        this.wallet.following.push(thread);
      } else {
        const existing = this.wallet.following[threadIndex] as PrivateThreadWithRelaySub;
        if (existing.notesSubscription) {
          this.relayService.unsubscribe(existing.notesSubscription!.id);
        }
        this.wallet.following[threadIndex] = thread;
      }
      this.loadThread(thread);
      return thread;
    } else {
      this.snackBar.open(`Unable to decode secure thread pointer.`, 'Hide', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return undefined;
    }
  }

  loadFollowings(thread: PrivateThreadWithRelaySub, indexStart = 0) {
    if (thread.followingSubscription) {
      this.relayService.unsubscribe(thread.followingSubscription.id);
    }
    const privateNotes$ = new Subject<NostrEvent>();
    privateNotes$.subscribe(async nostrEvent => {
      let keyIndex = 0;
      let ap: HDKey;
      let sp: HDKey | undefined;
      for (let i = indexStart; i < indexStart + 10; i++) {
        ap = thread!.indexMap.following.ap.deriveChildKey(i);
        if (nostrEvent.pubkey === ap.nostrPubKey) {
          keyIndex = i;
          sp = thread!.indexMap.following.sp.deriveChildKey(i);
          break;
        }
      }
      if (sp) {
        await this.loadFollowing('nprivatethread11' + nostrEvent.content, [sp.publicKey, sp.privateKey]);
      }
    });

    const followingPubKeys: string[] = [];
    for (let i = indexStart; i < indexStart + 10; i++) {
      const ap = thread.indexMap.following.ap.deriveChildKey(i);
      followingPubKeys.push(ap.nostrPubKey);
    }
    thread.followingSubscription = this.relayService.subscribe([{
      authors: followingPubKeys,
      kinds: [17761],
      limit: 100
    }], `nip76Service.loadFollowings.${thread.ap.nostrPubKey}`, 'Replaceable', privateNotes$);
  }

  async saveThread(thread: PrivateThreadWithRelaySub, privateKey?: string) {
    privateKey = privateKey || await this.passwordDialog('Save Channel Details');
    const ev = await thread.indexMap.post.encrypt(thread, privateKey);
    await this.dataService.publishEvent(ev);
    return true;
  }

  async saveNote(thread: PrivateThreadWithRelaySub, text: string) {
    const privateKey = await this.passwordDialog('Save Note');
    const postDocument = new PostDocument();
    postDocument.content = {
      text,
      pubkey: this.wallet.ownerPubKey,
      kind: nostrTools.Kind.Text
    }
    postDocument.index = text === 'start over please' ? 1 : thread.content!.last_known_index + 1;
    const event = await thread.indexMap.post.encrypt(postDocument, privateKey);
    await this.dataService.publishEvent(event);
    thread.content!.last_known_index = postDocument.index;
    await this.saveThread(thread, privateKey);
    return true;
  }

  async saveReaction(post: PostDocument, text: string, kind: nostrTools.Kind): Promise<PostDocument> {
    const privateKey = await this.passwordDialog('Save ' + (kind === nostrTools.Kind.Reaction ? 'Reaction' : 'Reply'));
    const postDocument = new PostDocument();
    postDocument.content = {
      kind,
      pubkey: this.wallet.ownerPubKey,
      text,
    };
    const created_at = Math.floor(Date.now() / 1000);
    postDocument.index = created_at - post.nostrEvent.created_at;
    const event = await post.reactionsIndex.encrypt(postDocument, privateKey, created_at, [['e', post.rp.nostrPubKey]]);
    await this.dataService.publishEvent(event);
    return postDocument;
  }

  async saveFollowing(thread: PrivateThreadWithRelaySub, following: PrivateThreadWithRelaySub) {
    const index = 0;//thread.following.length;
    const ap = thread.indexMap.following.ap.deriveChildKey(index);
    const sp = thread.indexMap.following.sp.deriveChildKey(index);
    const tp = await following.getThreadPointer([sp.publicKey, sp.privateKey]);
    const encrypted = tp.substring(16);
    let event = this.dataService.createEventWithPubkey(17761, encrypted, ap.nostrPubKey);
    const signature = signEvent(event, secp256k1.utils.bytesToHex(ap.privateKey)) as any;
    const signedEvent = event as Event;
    signedEvent.sig = signature;
    signedEvent.id = await getEventHash(event);
    await this.dataService.publishEvent(signedEvent);
    thread.following.push(following);
    return true;
  }
}
