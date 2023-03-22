import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FollowDocument, nip19Extension, Nip76Wallet, Nip76WebWalletStorage, PostDocument, PrivateChannel } from 'animiq-nip76-tools';
import * as nostrTools from 'nostr-tools';
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
}

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
      this.loadFollowings();
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
      let fchannel = this.findChannel(nostrEvent.pubkey);
      if (fchannel) {
        const foo = await fchannel.hdkIndex.readEvent(nostrEvent, true) as PrivateChannel;
        if (foo) {
          fchannel.content = foo.content;
          fchannel.ready = foo.ready;
        }
      } else if (nostrEvent.tags[0][0] === 'e') {
        const post = await channel.hdkIndex.readEvent(nostrEvent) as PostDocument;
        if (post) {
          post.channel = channel;
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
      }
    });
    channel.channelSubscription = this.relayService.subscribe(
      [{
        '#e': [channel.hdkIndex.eventTag],
        kinds: [17761],
        limit: length
      }],
      `nip76Service.loadChannel.${channel.hdkIndex.eventTag}`, 'Replaceable', privateChannel$
    );
  }

  findChannel(pubkey: string): PrivateChannelWithRelaySub | undefined {
    let channel = this.wallet?.channels.find(x => pubkey === x.hdkIndex.signingParent.nostrPubKey);
    if (!channel) {
      channel = this.wallet?.following.find(x => pubkey === x.hdkIndex.signingParent.nostrPubKey);
    }
    return channel;
  }

  private async loadFollowing(channelPointer: string | nip19Extension.PrivateChannelPointer, secret?: string | Uint8Array[]) {
    let pointer: nip19Extension.PrivateChannelPointer;
    if (typeof channelPointer === 'string') {
      const p = await nip19Extension.decode(channelPointer, secret!);
      pointer = p.data as nip19Extension.PrivateChannelPointer;
    } else {
      pointer = channelPointer;
    }
    if (pointer) {
      const channel = PrivateChannel.fromPointer(pointer, this.wallet.signingKey) as PrivateChannelWithRelaySub;
      if (channel.ownerPubKey === this.wallet.ownerPubKey) {
        const message = 'Self owned channels should only be initialized from the wallet directly.';
        this.snackBar.open(message, 'Hide', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        return undefined;
      }
      const privateChannel$ = new Subject<NostrEvent>();
      privateChannel$.subscribe(async nostrEvent => {
        const fchannel = await channel.hdkIndex.readEvent(nostrEvent, true) as PrivateChannel;
        if (fchannel) {
          channel.content = fchannel.content;
          channel.ready = fchannel.ready;
          channel.hdkIndex.signingParent._chainCode = hexToBytes(fchannel.content.chain_sign!);
          channel.hdkIndex.cryptoParent._chainCode = hexToBytes(fchannel.content.chain_crypto!);
          channel.hdkIndex.eventTag = channel.hdkIndex.signingParent.deriveChildKey(0).deriveChildKey(0).pubKeyHash;
          this.relayService.unsubscribe(channel.channelSubscription!.id);
          this.loadChannel(channel);
          this.wallet.following.push(channel);
        }
      });
      channel.channelSubscription = this.relayService.subscribe(
        [{
          authors: [channel.hdkIndex.signingParent.nostrPubKey],
          kinds: [17761],
          limit: length
        }],
        `nip76Service.loadFollowing.${channel.hdkIndex.eventTag}`, 'Replaceable', privateChannel$
      );
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

  loadFollowings() {
    if (this.followingSubscription) {
      this.relayService.unsubscribe(this.followingSubscription.id);
    }
    const privateNotes$ = new Subject<NostrEvent>();
    privateNotes$.subscribe(async nostrEvent => {
      const followDocument = await this.wallet.documentsIndex.readEvent(nostrEvent) as FollowDocument;
      if (followDocument) {
        const pointer: nip19Extension.PrivateChannelPointer = {
          ownerPubKey: followDocument.content.owner,
          signingKey: hexToBytes(followDocument.content.signing_key),
          cryptoKey: hexToBytes(followDocument.content.crypto_key),
          // relays: followDocument.content
        }
        await this.loadFollowing(pointer);
      }
    });

    this.followingSubscription = this.relayService.subscribe([{
      '#e': [this.wallet.documentsIndex.eventTag],
      kinds: [17761],
      limit: 100
    }], `nip76Service.loadFollowings.${startWith}`, 'Replaceable', privateNotes$);
  }

  async saveChannel(channel: PrivateChannelWithRelaySub, privateKey?: string) {
    privateKey = privateKey || await this.passwordDialog('Save Channel Details');
    const ev = await channel.hdkIndex.createEvent(channel, privateKey);
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
    const event = await channel.hdkIndex.createEvent(postDocument, privateKey);
    await this.dataService.publishEvent(event);
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
    const event = await post.channel.hdkIndex.createEvent(postDocument, privateKey);
    await this.dataService.publishEvent(event);
    return postDocument;
  }

  async saveFollowing(following: PrivateChannelWithRelaySub) {
    const privateKey = await this.passwordDialog('Save Follow');
    const followDocument = new FollowDocument();
    followDocument.content = {
      pubkey: this.wallet.ownerPubKey,
      kind: nostrTools.Kind.Contacts,
      signing_key: bytesToHex(following.hdkIndex.signingParent.publicKey),
      crypto_key: bytesToHex(following.hdkIndex.cryptoParent.publicKey),
      owner: following.ownerPubKey
    }
    const event = await this.wallet.documentsIndex.createEvent(followDocument, privateKey);
    await this.dataService.publishEvent(event);
    return true;
  }

}


