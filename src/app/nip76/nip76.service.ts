import * as nostrTools from 'nostr-tools';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as secp256k1 from '@noble/secp256k1'
import { ContentDocument, HDKey, HDKissAddress, HDKissDocumentType, IThreadPayload, nip19Extension, Nip76Wallet, PostDocument, PrivateThread, Versions } from 'animiq-nip76-tools';
import { Event, getEventHash, signEvent, Filter } from 'nostr-tools';
import { Subject } from 'rxjs';
import { DataService } from '../services/data';
import { NostrEvent, NostrProfileDocument, NostrRelaySubscription } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { RelayService } from '../services/relay';
import { SecurityService } from '../services/security';
import { PasswordDialog, PasswordDialogData } from '../shared/password-dialog/password-dialog';
import { AddThreadDialog, AddThreadDialogData } from './add-thread-dialog/add-thread-dialog.component';
import { UIService } from '../services/ui';

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
          this.loadThreads();
        } else if (this.wallet.requiresLogin) {
          this.login();
        }
      });
    });
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

  async saveWallet(): Promise<boolean> {
    return this.passwordDialog('Save Private Thread Keys', (privateKey: string) => {
      this.wallet.saveWallet(privateKey);
    });
  }

  async login(): Promise<boolean> {
    return this.passwordDialog('Load Private Thread Keys', async (privateKey: string) => {
      if (await this.wallet.readKey(privateKey, 'backup', '')) {
        this.loadThreads();
        await this.wallet.saveWallet(privateKey);
      }
    });
  }

  async logout() {
    const ownerPubKey = this.wallet.ownerPubKey;
    this.wallet.clearSession();
    this.wallet = await Nip76Wallet.create();
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

  loadThreads(threads?: PrivateThreadWithRelaySub[]) {
    const ownerThreadSearch = !threads;
    if (ownerThreadSearch) {
      [...Array(4)].forEach((_, i) => this.wallet.getThread(i));
      threads = this.wallet.threads;
    }
    if (threads![0].threadSubscription) {
      this.relayService.unsubscribe(threads![0].threadSubscription.id);
    }
    const privateThreads$ = new Subject<NostrEvent>();
    privateThreads$.subscribe(async nostrEvent => {
      const thread = this.findThread(nostrEvent.pubkey);
      if (thread) {
        const decrypted = await thread.address.decrypt(nostrEvent.content, thread.indexMap.post.sp.publicKey, thread.v);
        thread.decryptedContent = JSON.parse(decrypted) as IThreadPayload;
        thread.ready = true;
        if (ownerThreadSearch) {
          this.loadFollowings(thread);
          if (!this.wallet.threads.find(x => !x.ready)) {
            [...Array(this.wallet.threads.length + 2)].forEach((_, i) => this.wallet.getThread(i));
            this.loadThreads();
          }
        }
      }
    });
    const threadPubKeys = threads!.map(x => x.indexMap.post.ap.nostrPubKey);
    threads![0].threadSubscription = this.relayService.subscribe([{
      authors: threadPubKeys,
      kinds: [17761],
      limit: 100
    }], `nip76Service.loadThreads.${threads![0].a}`, 'Replaceable', privateThreads$);
  }

  findThread(pubkey: string): PrivateThreadWithRelaySub | undefined {
    let thread = this.wallet.threads.find(x => pubkey === x.indexMap.post.ap.nostrPubKey);
    if (!thread) {
      thread = this.wallet.following.find(x => pubkey === x.indexMap.post.ap.nostrPubKey);
    }
    return thread;
  }

  async saveThread(thread: PrivateThreadWithRelaySub) {
    const encrypted = await thread.address.encrypt(JSON.stringify(thread.decryptedContent), thread.indexMap.post.sp.publicKey, 1);
    let event = this.dataService.createEventWithPubkey(17761, encrypted, thread.indexMap.post.ap.nostrPubKey);
    thread!.decryptedContent.created_at = event.created_at;
    event.content = encrypted;
    const signature = signEvent(event, secp256k1.utils.bytesToHex(thread.indexMap.post.ap.privateKey)) as any;
    const signedEvent = event as Event;
    signedEvent.sig = signature;
    signedEvent.id = await getEventHash(event);
    await this.dataService.publishEvent(signedEvent);
    return true;
  }

  loadNotes(thread: PrivateThreadWithRelaySub, indexStart = 0) {
    if (thread.notesSubscription) {
      this.relayService.unsubscribe(thread.notesSubscription.id);
    }
    const privateNotes$ = new Subject<NostrEvent>();
    privateNotes$.subscribe(async nostrEvent => {
      let keyIndex = 0;
      let ap: HDKey;
      let sp: HDKey | undefined;
      for (let i = indexStart; i < indexStart + 10; i++) {
        ap = thread!.indexMap.post.ap.deriveChildKey(i);
        if (nostrEvent.pubkey === ap.nostrPubKey) {
          keyIndex = i;
          sp = thread!.indexMap.post.sp.deriveChildKey(i);
          break;
        }
      }
      if (sp) {
        const postIndex = thread.posts.findIndex(x => x.id === nostrEvent.id);
        if (postIndex === -1 || thread.posts[postIndex].created_at < nostrEvent.created_at) {
          const post = new PostDocument();
          post.ownerPubKey = thread.ownerPubKey;
          post.setKeys(ap!, sp!);
          post.address = new HDKissAddress({ publicKey: ap!.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
          post.thread = thread;
          post.sig = nostrEvent.sig;
          post.id = nostrEvent.id;
          post.a = post.a = post.address.value;
          post.v = 3;
          post.content = nostrEvent.content;
          post.i = keyIndex;
          post.created_at = nostrEvent.created_at;
          const decrypted = await post.address.decrypt(post.content, sp.publicKey, post.v);
          post.decryptedContent = JSON.parse(decrypted);
          if (post.decryptedContent) {
            nostrEvent.content = post.decryptedContent.message!;
            // post.rp 
          }
          post.nostrEvent = nostrEvent;
          if (postIndex === -1) {
            thread.posts.push(post);
          } else {
            thread.posts[postIndex] = post;
          }
          thread.posts = thread.posts.sort((a, b) => b.created_at - a.created_at);
          if (thread.posts.length > 3) this.loadReactions(thread.posts);
        }
      }
    });

    const notePubKeys: string[] = [];
    for (let i = indexStart; i < indexStart + 10; i++) {
      const ap = thread.indexMap.post.ap.deriveChildKey(i);
      notePubKeys.push(ap.nostrPubKey);
    }
    thread.notesSubscription = this.relayService.subscribe([{
      authors: notePubKeys,
      kinds: [17761],
      limit: 100
    }], `nip76Service.loadNotes.${thread.a}`, 'Replaceable', privateNotes$);
  }

  async saveNote(thread: PrivateThreadWithRelaySub, noteText: string) {
    const postDocument = new PostDocument();
    postDocument.decryptedContent = {
      message: noteText,
      kind: nostrTools.Kind.Text
    }
    const index = thread.decryptedContent.last_known_index + 1;
    const ap = thread.indexMap.post.ap.deriveChildKey(index);
    const sp = thread.indexMap.post.sp.deriveChildKey(index);
    const address = new HDKissAddress({ publicKey: ap.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
    const encrypted = await address.encrypt(JSON.stringify(postDocument.decryptedContent), sp.publicKey, 1);
    let event = this.dataService.createEventWithPubkey(17761, encrypted, ap.nostrPubKey);
    const signature = signEvent(event, secp256k1.utils.bytesToHex(ap.privateKey)) as any;
    const signedEvent = event as Event;
    signedEvent.sig = signature;
    signedEvent.id = await getEventHash(event);
    await this.dataService.publishEvent(signedEvent);
    thread.decryptedContent.last_known_index = index;
    await this.saveThread(thread);
    return true;
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
      const threadIndex = this.wallet.following.findIndex(x => x.a == thread.a);
      if (threadIndex === -1) {
        this.wallet.following.push(thread);
      } else {
        const existing = this.wallet.following[threadIndex] as PrivateThreadWithRelaySub;
        if (existing.notesSubscription) {
          this.relayService.unsubscribe(existing.notesSubscription!.id);
        }
        this.wallet.following[threadIndex] = thread;
      }
      this.loadThreads(this.wallet.following);
      this.loadNotes(thread);
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
    }], `nip76Service.loadFollowings.${thread.a}`, 'Replaceable', privateNotes$);
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

  loadReactions(posts: PostDocumentWithRelaySub[]) {
    if (posts[0].reactionSubscription) {
      this.relayService.unsubscribe(posts[0].reactionSubscription.id);
    }
    const privateNotes$ = new Subject<NostrEvent>();
    privateNotes$.subscribe(async nostrEvent => {
      const post = posts.find(x => x.rp.nostrPubKey === nostrEvent.tags[0][1])!;
      let keyIndex = nostrEvent.created_at - post.created_at;
      const ap = post!.reactionsIndex.ap.deriveChildKey(keyIndex);
      const sp = post!.reactionsIndex.sp.deriveChildKey(keyIndex);
      const reply = new PostDocument();
      reply.setKeys(ap!, sp!);
      reply.address = new HDKissAddress({ publicKey: ap!.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
      reply.thread = post.thread;
      reply.sig = nostrEvent.sig;
      reply.id = nostrEvent.id;
      reply.a = reply.a = reply.address.value;
      reply.v = 3;
      reply.content = nostrEvent.content;
      reply.i = keyIndex;
      reply.created_at = nostrEvent.created_at;
      const decrypted = await reply.address.decrypt(reply.content, sp.publicKey, reply.v);
      reply.decryptedContent = JSON.parse(decrypted) || {
        kind: nostrTools.Kind.Text,
        message: decrypted || nostrEvent.content
      };
      nostrEvent.content = reply.decryptedContent?.message!;
      reply.nostrEvent = nostrEvent;

      const coll = reply.decryptedContent.kind === nostrTools.Kind.Text ? post.replies : post.reactions;
      const collIndex = coll.findIndex(x => x.id === nostrEvent.id);
      if (collIndex === -1) {
        coll.push(reply);
        if (reply.decryptedContent.kind === nostrTools.Kind.Text) {
          post.replies = post.replies.sort((a, b) => b.created_at - a.created_at);
          this.loadReactions(post.replies)
        } else {
          const count = post.reactionTracker[reply.decryptedContent.message!];
          post.reactionTracker[reply.decryptedContent.message!] = count ? count + 1 : 1;
        }
      } else {
        coll[collIndex] = reply;
      }
    });

    posts[0].reactionSubscription = this.relayService.subscribe([{
      '#e': posts.map(x => x.rp.nostrPubKey),
      kinds: [17761],
      limit: 100
    }], `nip76Service.loadReactions.${posts[0].a}`, 'Replaceable', privateNotes$);
  }

  async saveReaction(post: PostDocument, message: any, kind: nostrTools.Kind): Promise<PostDocument> {
    const postDocument = new PostDocument();
    postDocument.decryptedContent = {
      message,
      kind,
      authorPubKey: this.wallet.ownerPubKey
    };

    await this.passwordDialog('Save Private Thread Keys', (privateKey) => {
      post.decryptedContent.sig = secp256k1.utils.bytesToHex(
        secp256k1.schnorr.signSync(post.rp.nostrPubKey, privateKey)
      );
    });

    const created_at = Math.floor(Date.now() / 1000);
    const index = created_at - post.created_at;
    const ap = post.reactionsIndex.ap.deriveChildKey(index);
    const sp = post.reactionsIndex.sp.deriveChildKey(index);
    const address = new HDKissAddress({ publicKey: ap.publicKey, type: HDKissDocumentType.Post, version: Versions.animiqAPI3 });
    const encrypted = await address.encrypt(JSON.stringify(postDocument.decryptedContent), sp.publicKey, 1);
    let event = this.dataService.createEventWithPubkey(17761, encrypted, ap.nostrPubKey);
    event.created_at = created_at;
    event.tags.push(['e', post.rp.nostrPubKey]);
    const signature = signEvent(event, secp256k1.utils.bytesToHex(ap.privateKey)) as any;
    const signedEvent = event as Event;
    signedEvent.sig = signature;
    signedEvent.id = await getEventHash(event);
    await this.dataService.publishEvent(signedEvent);
    return postDocument;
  }
}
