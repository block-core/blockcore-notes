import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as secp256k1 from '@noble/secp256k1';
import { FollowDocument, HDKey, nip19Extension, Nip76Wallet, Nip76WebWalletStorage, PostDocument, PrivateChannel } from 'animiq-nip76-tools';
import * as nostrTools from 'nostr-tools';
import { Event, getEventHash, signEvent } from 'nostr-tools';
import { startWith, Subject } from 'rxjs';
import { DataService } from '../services/data';
import { NostrEvent, NostrRelaySubscription } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { RelayService } from '../services/relay';
import { SecurityService } from '../services/security';
import { UIService } from '../services/ui';
import { PasswordDialog, PasswordDialogData } from '../shared/password-dialog/password-dialog';
import { AddChannelDialog, AddChannelDialogData } from './add-thread-dialog/add-thread-dialog.component';

const nostrPrivKeyAddress = 'blockcore:notes:nostr:prvkey';

interface PrivateChannelWithRelaySub extends PrivateChannel {
  channelSubscription?: NostrRelaySubscription;
  notesSubscription?: NostrRelaySubscription;
  followingSubscription?: NostrRelaySubscription;
}

// Nip76Wallet.store = new WebWalletStorage();

@Injectable({
  providedIn: 'root'
})
export class Nip76Service {

  wallet!: Nip76Wallet;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private security: SecurityService,
    private profileService: ProfileService,
    private relayService: RelayService,
    private dataService: DataService,
    private ui: UIService
  ) {
    Nip76WebWalletStorage.fromStorage({ publicKey: this.profileService.profile!.pubkey }).then(wallet => {
      this.wallet = wallet;
      if (this.wallet.isInSession) {
        Array(4).forEach((_, i) => wallet.getChannel(i));
        this.loadChannel(wallet.channels[0]);
        this.loadFollowings();
      } else if (!this.wallet.isGuest) {
        this.login();
      }
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
    const privateKey = await this.passwordDialog('Save Private Channel Keys');
    await this.wallet.saveWallet(privateKey);
    return true;
  }

  async login(): Promise<boolean> {
    const privateKey = await this.passwordDialog('Load Private Channel Keys');
    this.wallet = await Nip76WebWalletStorage.fromStorage({ privateKey });
    if (this.wallet.isInSession) {
      Array(4).forEach((_, i) => this.wallet.getChannel(i));
      this.loadChannel(this.wallet.channels[0]);
    }
    return this.wallet.isInSession;
  }

  async logout() {
    this.wallet.channels.forEach((channel: PrivateChannelWithRelaySub) => {
      if (channel.channelSubscription) {
        this.relayService.unsubscribe(channel.channelSubscription.id);
      }
    });
    this.wallet.clearSession();
    this.wallet = await Nip76WebWalletStorage.fromStorage({ publicKey: this.wallet.ownerPubKey });
  }

  async previewChannel(): Promise<PrivateChannelWithRelaySub> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(AddChannelDialog, {
        data: { channelPointer: '' },
        maxWidth: '200vw',
        panelClass: 'full-width-dialog',
      });
      dialogRef.afterClosed().subscribe(async (result: AddChannelDialogData) => {
        if (result?.channelPointer) {
          const following = await this.loadFollowing(result.channelPointer, '');
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

  loadChannel(channel: PrivateChannelWithRelaySub, startIndex = 0, length = 20) {
    if (channel.channelSubscription) {
      this.relayService.unsubscribe(channel.channelSubscription.id);
    }
    const privateChannel$ = new Subject<NostrEvent>();
    privateChannel$.subscribe(async nostrEvent => {
      const fchannel = this.findChannel(nostrEvent.pubkey);
      if (fchannel) {
        if (await fchannel?.indexMap.post.decrypt2(fchannel, nostrEvent)) {
          // if (fchannel.ownerPubKey === this.wallet.ownerPubKey) {
          //   this.loadFollowings(fchannel as PrivateChannelWithRelaySub);
          // }
        }
      } else if (!nostrEvent.tags[0]) {
        const post = channel.posts.find(x => x.ap.nostrPubKey === nostrEvent.pubkey);
        if (post) {
          await channel.indexMap.post.decrypt2(post, nostrEvent);
          nostrEvent.content = post.content?.text! || nostrEvent.content;
        }
      } else if (nostrEvent.tags[0][0] === 'e') {
        const post = new PostDocument();
        post.channel = channel;
        await channel.indexMap.post.decrypt2(post, nostrEvent);
        nostrEvent.content = post.content?.text! || nostrEvent.content;
        channel.posts = [...channel.posts, post].sort((a, b) => b.nostrEvent.created_at - a.nostrEvent.created_at);
        var i = channel.posts.length;
        while (i--) {
          const p1 = channel.posts[i];
          if (p1.content.tags?.length && p1.content.tags[0][0] == 'e') {
            const p2 = channel.posts.find(x => x.nostrEvent.id === p1.content.tags![0][1]);
            if (p2) {
              channel.posts.splice(i, 1);
              if (p1.content.kind === nostrTools.Kind.Text) {
                p2.replies.push(p1);
              } else {
                const count = p2.reactionTracker[p1.content.text!];
                p2.reactionTracker[p1.content.text!] = count ? count + 1 : 1;
              }
            }
          }
        }
      }
    });
    channel.channelSubscription = this.relayService.subscribe(
      channel.getRelayFilter(startIndex, length),
      `nip76Service.loadChannel.${channel.ap.nostrPubKey}`, 'Replaceable', privateChannel$
    );
  }

  findChannel(pubkey: string): PrivateChannelWithRelaySub | undefined {
    let channel = this.wallet?.channels.find(x => pubkey === x.ap.nostrPubKey);
    if (!channel) {
      channel = this.wallet?.following.find(x => pubkey === x.ap.nostrPubKey);
    }
    return channel;
  }

  private async loadFollowing(channelPointer: string, secret: string | Uint8Array[]) {
    const pointer = await nip19Extension.decode(channelPointer, secret);
    if (pointer) {
      const channel = PrivateChannel.fromPointer(pointer.data as nip19Extension.PrivateChannelPointer);
      if (channel.ownerPubKey === this.wallet.ownerPubKey) {
        const message = 'Self owned channels should only be initialized from the wallet directly.';
        this.snackBar.open(message, 'Hide', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        return undefined;
      }
      const channelIndex = this.wallet.following.findIndex(x => x.ap.nostrPubKey == channel.ap.nostrPubKey);
      if (channelIndex === -1) {
        this.wallet.following.push(channel);
      } else {
        const existing = this.wallet.following[channelIndex] as PrivateChannelWithRelaySub;
        if (existing.notesSubscription) {
          this.relayService.unsubscribe(existing.notesSubscription!.id);
        }
        this.wallet.following[channelIndex] = channel;
      }
      this.loadChannel(channel);
      return channel;
    } else {
      this.snackBar.open(`Unable to decode secure channel pointer.`, 'Hide', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return undefined;
    }
  }

  followingSubscription?: NostrRelaySubscription;

  loadFollowings(indexStart = 0) {
    if (this.followingSubscription) {
      this.relayService.unsubscribe(this.followingSubscription.id);
    }
    const privateNotes$ = new Subject<NostrEvent>();
    privateNotes$.subscribe(async nostrEvent => {
      let keyIndex = 0;
      let ap: HDKey;
      let sp: HDKey | undefined;
      for (let i = indexStart; i < indexStart + 10; i++) {
        ap = this.wallet.followingIndex.ap.deriveChildKey(i);
        if (nostrEvent.pubkey === ap.nostrPubKey) {
          keyIndex = i;
          sp = this.wallet.followingIndex.sp.deriveChildKey(i);
          break;
        }
      }
      if (sp) {
        const followingDoc = new FollowDocument();
        followingDoc.index = keyIndex;
        if (await this.wallet.followingIndex.decrypt3(followingDoc, nostrEvent)) {
          const channel = PrivateChannel.fromPointer({
            ownerPubKey: followingDoc.content.owner,
            addresses:{
              pubkey: followingDoc.content.ap.publicKey,
              chain: followingDoc.content.ap.chainCode,
            },
            secrets:{
              pubkey: followingDoc.content.sp.publicKey,
              chain: followingDoc.content.sp.chainCode,
            },
          });
          this.wallet.following.push(channel);
          this.loadChannel(channel);
        }
      }
    });

    const followingPubKeys: string[] = [];
    for (let i = indexStart; i < indexStart + 10; i++) {
      const ap = this.wallet.followingIndex.ap.deriveChildKey(i);
      followingPubKeys.push(ap.nostrPubKey);
    }
    this.followingSubscription = this.relayService.subscribe([{
      authors: followingPubKeys,
      kinds: [17761],
      limit: 100
    }], `nip76Service.loadFollowings.${startWith}`, 'Replaceable', privateNotes$);
  }

  async saveChannel(channel: PrivateChannelWithRelaySub, privateKey?: string) {
    privateKey = privateKey || await this.passwordDialog('Save Channel Details');
    const ev = await channel.indexMap.post.encrypt2(channel, channel, privateKey, this.wallet.signingKey);
    await this.dataService.publishEvent(ev);
    return true;
  }

  async saveNote(channel: PrivateChannelWithRelaySub, text: string) {
    const privateKey = await this.passwordDialog('Save Note');
    const postDocument = new PostDocument();
    postDocument.content = {
      text,
      pubkey: this.wallet.ownerPubKey,
      kind: nostrTools.Kind.Text
    }
    // postDocument.index = text === 'start over please' ? 1 : channel.content!.last_known_index + 1;
    // const event = await channel.indexMap.post.encrypt(postDocument, privateKey);
    const event = await channel.indexMap.post.encrypt2(postDocument, channel, privateKey, this.wallet.signingKey);
    await this.dataService.publishEvent(event);
    // channel.content!.last_known_index = postDocument.index;
    // await this.saveChannel(channel, privateKey);
    return true;
  }

  async saveReaction(post: PostDocument, text: string, kind: nostrTools.Kind): Promise<PostDocument> {
    const privateKey = await this.passwordDialog('Save ' + (kind === nostrTools.Kind.Reaction ? 'Reaction' : 'Reply'));
    const postDocument = new PostDocument();
    postDocument.content = {
      kind,
      pubkey: this.wallet.ownerPubKey,
      text,
      tags: [['e', post.nostrEvent.id]]
    };
    const event = await post.channel.indexMap.post.encrypt2(postDocument, post.channel, privateKey, this.wallet.signingKey);
    await this.dataService.publishEvent(event);
    // const created_at = Math.floor(Date.now() / 1000);
    // postDocument.index = created_at - post.nostrEvent.created_at;
    // const event = await post.reactionsIndex.encrypt(postDocument, privateKey, created_at, [['e', post.rp.nostrPubKey]]);
    // await this.dataService.publishEvent(event);
    return postDocument;
  }

  async saveFollowing(channel: PrivateChannelWithRelaySub, following: PrivateChannelWithRelaySub) {
    const privateKey = await this.passwordDialog('Save Follow');
    const followDocument = new FollowDocument();
    followDocument.content = {
      pubkey: this.wallet.ownerPubKey,
      kind: nostrTools.Kind.Contacts,
      ap: following.ap,
      sp: following.sp,
      owner: following.ownerPubKey
    }
    const event = await this.wallet.followingIndex.encrypt3(followDocument, this.wallet, privateKey);
    await this.dataService.publishEvent(event);
    return true;
  }

  // async saveFollowingOLD(channel: PrivateChannelWithRelaySub, following: PrivateChannelWithRelaySub) {

  //   const index = 0;//channel.following.length;
  //   const ap = channel.indexMap.following.ap.deriveChildKey(index);
  //   const sp = channel.indexMap.following.sp.deriveChildKey(index);
  //   const tp = await following.getChannelPointer([sp.publicKey, sp.privateKey]);
  //   const encrypted = tp.substring(16);
  //   let event = this.dataService.createEventWithPubkey(17761, encrypted, ap.nostrPubKey);
  //   const signature = signEvent(event, bytesToHex(ap.privateKey)) as any;
  //   const signedEvent = event as Event;
  //   signedEvent.sig = signature;
  //   signedEvent.id = await getEventHash(event);
  //   await this.dataService.publishEvent(signedEvent);
  //   channel.following.push(following);
  //   return true;
  // }
}


