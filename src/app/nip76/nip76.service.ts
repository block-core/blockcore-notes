import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { bech32 } from '@scure/base';
import {
  ContentDocument, HDKey, getNowSeconds,
  HDKIndex, HDKIndexType, Invitation, nip19Extension, Nip76Wallet,
  Nip76WebWalletStorage, NostrKinds, PostDocument, PrivateChannel, Rsvp, Versions, walletRsvpDocumentsOffset
} from 'animiq-nip76-tools';
import * as nostrTools from 'nostr-tools';
import { filter, firstValueFrom, Subject } from 'rxjs';
import { DataService } from '../services/data';
import { NostrEvent, NostrRelaySubscription } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { RelayService } from '../services/relay';
import { SecurityService } from '../services/security';
import { UIService } from '../services/ui';
import { PasswordDialog, PasswordDialogData } from '../shared/password-dialog/password-dialog';
import { AddChannelDialog, AddChannelDialogData } from './nip76-add-channel-dialog/add-channel-dialog.component';
import { AddInvitationDialogData, Nip76AddInvitationComponent } from './nip76-add-invitation/nip76-add-invitation.component';

const nostrPrivKeyAddress = 'blockcore:notes:nostr:prvkey';

interface PrivateChannelWithRelaySub extends PrivateChannel {
  channelSubscription?: NostrRelaySubscription;
}

export const defaultSnackBarOpts: MatSnackBarConfig<any> = {
  duration: 3000,
  horizontalPosition: 'center',
  verticalPosition: 'bottom',
};

@Injectable({
  providedIn: 'root'
})
export class Nip76Service {

  wallet!: Nip76Wallet;
  documentsSubscription?: NostrRelaySubscription;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private security: SecurityService,
    private profileService: ProfileService,
    private relayService: RelayService,
    private dataService: DataService,
    private ui: UIService
  ) {
    if (this.profileService.profile) {
      Nip76WebWalletStorage.fromStorage({ publicKey: this.profileService.profile!.pubkey }).then(wallet => {
        this.wallet = wallet;
        if (this.wallet.isInSession) {
          this.loadDocuments();
        } else if (!this.wallet.isGuest) {
          this.login();
        }
      });
    }
  }

  async passwordDialog(actionPrompt: string): Promise<string> {
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
            this.snackBar.open(`Unable to access user private key. Probably wrong password. Try again.`, 'Hide', defaultSnackBarOpts);
            reject();
          }
        } else {
          reject('Unable to access user private key.');
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
      this.loadDocuments();
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

  loadDocuments(start = 1, length = 20) {
    const channelPubkeys = this.wallet.documentsIndex.getDocKeys(start, length);
    const invitePubkeys = this.wallet.documentsIndex.getDocKeys(start + walletRsvpDocumentsOffset, length);
    if (this.documentsSubscription) {
      this.relayService.unsubscribe(this.documentsSubscription.id);
    }
    const privateNotes$ = new Subject<NostrEvent>();
    privateNotes$.subscribe(async nostrEvent => {
      let docIndex = channelPubkeys.findIndex(x => x === nostrEvent.pubkey) + start;
      if (docIndex) {
        const doc = await this.wallet.documentsIndex.readEvent(nostrEvent, docIndex) as PrivateChannel;
        if (doc) {
          this.loadChannel(doc);
        }
      } else {
        docIndex = invitePubkeys.findIndex(x => x === nostrEvent.pubkey) + start + walletRsvpDocumentsOffset;
        const doc = await this.wallet.documentsIndex.readEvent(nostrEvent, docIndex);
        if (doc && doc instanceof Rsvp) {
          const pointer: nip19Extension.PrivateChannelPointer = {
            type: doc.content.type,
            docIndex: doc.content.pointerDocIndex,
            signingKey: doc.content.signingKey,
            cryptoKey: doc.content.cryptoKey
          };
          doc.pointer = pointer;
          const rsvpIndex = HDKIndex.fromChannelPointer(pointer);
          const channel = await this.readChannelIndex(rsvpIndex, pointer);
        }
      }
    });
    const filters = [
      { authors: channelPubkeys, kinds: [17761], limit: length },
      { authors: invitePubkeys, kinds: [17761], limit: length }
    ];
    this.documentsSubscription = this.relayService.subscribe(filters,
      `nip76Service.loadDocuments.${start}-${length}`, 'Replaceable', privateNotes$);
  }

  loadChannel(channel: PrivateChannelWithRelaySub, start = 1, length = 20) {
    const invitePubs = channel.dkxInvite?.getDocKeys(start, length);
    if (channel.channelSubscription) {
      this.relayService.unsubscribe(channel.channelSubscription.id);
    }
    const privateChannel$ = new Subject<NostrEvent>();
    privateChannel$.subscribe(async nostrEvent => {
      if (channel.dkxPost.eventTag === nostrEvent.tags[0][1]) {
        const post = await channel.dkxPost.readEvent(nostrEvent);
      } else if (channel.dkxRsvp.eventTag === nostrEvent.tags[0][1]) {
        const rsvp = await channel.dkxRsvp.readEvent(nostrEvent);
      } else if (invitePubs) {
        const docIndex = invitePubs.findIndex(x => x === nostrEvent.pubkey) + start;
        const invite = await channel.dkxInvite.readEvent(nostrEvent, docIndex);
      }
    });
    const filters: nostrTools.Filter[] = [
      { '#e': [channel.dkxPost.eventTag], kinds: [17761], limit: length },
      { '#e': [channel.dkxRsvp.eventTag], kinds: [17761], limit: length },
    ];
    if (invitePubs) {
      filters.push({ authors: invitePubs, kinds: [17761], limit: 100 })
    }
    channel.channelSubscription = this.relayService.subscribe(
      filters,
      `nip76Service.loadChannel.${channel.dkxPost.eventTag}`,
      'Replaceable',
      privateChannel$
    );
  }

  findChannel(pubkey: string): PrivateChannelWithRelaySub | undefined {
    return this.wallet?.channels.find(x => pubkey === x.dkxPost.signingParent.nostrPubKey);
  }

  async readInvitationDialog(): Promise<PrivateChannel> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(AddChannelDialog, {
        data: { channelPointer: '' },
        maxWidth: '200vw',
        panelClass: 'full-width-dialog',
      });
      dialogRef.afterClosed().subscribe(async (result: AddChannelDialogData) => {
        if (result?.channelPointer) {
          const channel = await this.readChannelPointer(result.channelPointer, result.password!);
          if (channel) {
            resolve(channel);
          } else {
            reject();
          }
        } else {
          reject();
        }
      });
    });
  }

  async addInvitation(channel: PrivateChannel): Promise<Invitation> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(Nip76AddInvitationComponent, {
        data: { channelPointer: '', channel },
        maxWidth: '200vw',
        panelClass: 'full-width-dialog',
      });
      dialogRef.afterClosed().subscribe(async (result: AddInvitationDialogData) => {
        if (result) {
          const invitation = await this.saveInvitation(channel, result);
          if (invitation) {
            resolve(invitation);
          } else {
            reject();
          }
        } else {
          reject();
        }
      });
    });
  }

  async readInvitation(invite: Invitation): Promise<PrivateChannel | undefined> {
    if (!invite.content.signingParent && !invite.content.cryptoParent) {
      this.snackBar.open(`Encountered a suspended invitation from ${invite.ownerPubKey}`, 'Hide', defaultSnackBarOpts);
      return undefined;
    }
    const channelIndex = new HDKIndex(HDKIndexType.Singleton, invite.content.signingParent!, invite.content.cryptoParent!);
    const channelIndex$ = new Subject<NostrEvent>();
    const channelIndexSub = this.relayService.subscribe(
      [{ authors: [channelIndex.signingParent.nostrPubKey], kinds: [17761], limit: 1 }],
      `nip76Service.readInvitation.${channelIndex.signingParent.nostrPubKey}`, 'Replaceable', channelIndex$
    );
    const nostrEvent = await firstValueFrom(channelIndex$);
    this.relayService.unsubscribe(channelIndexSub.id);
    if (nostrEvent) {
      const channel = await channelIndex.readEvent(nostrEvent) as PrivateChannel;
      if (channel) {
        channel.invitation = invite;
        const exisitng = this.wallet.documentsIndex.documents.find(x => x.nostrEvent.id === nostrEvent.id) as PrivateChannel;
        if (exisitng) {
          channel.dkxPost.documents = exisitng.dkxPost.documents;
          channel.dkxRsvp.documents = exisitng.dkxRsvp.documents;
          channel.dkxInvite = exisitng.dkxInvite;
          const index = this.wallet.documentsIndex.documents.findIndex(x => x.nostrEvent.id === nostrEvent.id);
          this.wallet.documentsIndex.documents[index] = channel;
        } else {
          this.wallet.documentsIndex.documents.push(channel);
        }
        this.loadChannel(channel);
        return channel;
      } else {
        this.snackBar.open(`Unable to read contents the channel pointer keyset.`, 'Hide', defaultSnackBarOpts);
      }
    } else {
      this.snackBar.open(`Unable to locate the channel pointer keyset.`, 'Hide', defaultSnackBarOpts);
    }
    return undefined;
  }

  async readChannelPointer(channelPointer: string, secret?: string): Promise<PrivateChannel | undefined> {
    try {
      const words = bech32.decode(channelPointer, 5000).words;
      const pointerType = Uint8Array.from(bech32.fromWords(words))[0] as nip19Extension.PointerType;
      if ((pointerType & nip19Extension.PointerType.SharedSecret) == nip19Extension.PointerType.SharedSecret) {
        secret = await this.passwordDialog('Preview Private Invitation');
      }
      const p = await nip19Extension.decode(channelPointer, secret!);
      const pointer = p.data as nip19Extension.PrivateChannelPointer;

      if (pointer) {
        if ((pointer.type & nip19Extension.PointerType.FullKeySet) === nip19Extension.PointerType.FullKeySet) {
          const signingParent = new HDKey({ publicKey: pointer.signingKey, chainCode: pointer.signingChain, version: Versions.nip76API1 });
          const cryptoParent = new HDKey({ publicKey: pointer.cryptoKey, chainCode: pointer.cryptoChain, version: Versions.nip76API1 });
          const invite = new Invitation();
          pointer.docIndex = -1;
          invite.pointer = pointer;
          invite.content = {
            kind: NostrKinds.PrivateChannelInvitation,
            pubkey: signingParent.nostrPubKey,
            docIndex: pointer.docIndex,
            signingParent,
            cryptoParent
          };
          invite.ready = true;
          return this.readInvitation(invite);
        } else {
          const inviteIndex = HDKIndex.fromChannelPointer(pointer);
          return this.readChannelIndex(inviteIndex, pointer);
        }
      } else {
        this.snackBar.open(`Unable to decode channel pointer string.`, 'Hide', defaultSnackBarOpts);
      }
    } catch (error) {
      this.snackBar.open(`${error}`, 'Hide', defaultSnackBarOpts);
    }
    return undefined;
  }

  async readChannelIndex(inviteIndex: HDKIndex, pointer: nip19Extension.PrivateChannelPointer): Promise<PrivateChannel | undefined> {
    const inviteIndex$ = new Subject<NostrEvent>();
    const inviteIndexSub = this.relayService.subscribe(
      [{ authors: [inviteIndex.signingParent.nostrPubKey], kinds: [17761], limit: 1 }],
      `nip76Service.readChannelIndex.${inviteIndex.signingParent.nostrPubKey}`, 'Replaceable', inviteIndex$
    );
    const nostrEvent = await firstValueFrom(inviteIndex$);
    this.relayService.unsubscribe(inviteIndexSub.id);
    if (nostrEvent) {
      const invite = await inviteIndex.readEvent(nostrEvent) as Invitation;
      if (invite) {
        invite.pointer = pointer;
        return await this.readInvitation(invite);
      } else {
        this.snackBar.open(`Unable to read contents the channel pointer record.`, 'Hide', defaultSnackBarOpts);
      }
    } else {
      this.snackBar.open(`Unable to locate channel pointer record.`, 'Hide', defaultSnackBarOpts);
    }
    return undefined;
  }

  async saveChannel(channel: PrivateChannel, privateKey?: string) {
    privateKey = privateKey || await this.passwordDialog('Save Channel Details');
    channel.content.created_at = channel.content.created_at || channel?.nostrEvent.created_at || getNowSeconds();
    const ev = await this.wallet.documentsIndex.createEvent(channel, privateKey);
    await this.dataService.publishEvent(ev);
    return true;
  }

  async saveNote(channel: PrivateChannel, text: string) {
    const privateKey = await this.passwordDialog('Save Note');
    const postDocument = new PostDocument();
    postDocument.content = {
      text,
      pubkey: this.wallet.ownerPubKey,
      kind: nostrTools.Kind.Text
    }
    const event = await channel.dkxPost.createEvent(postDocument, privateKey);
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
    const event = await post.dkxParent.createEvent(postDocument, privateKey);
    await this.dataService.publishEvent(event);
    return postDocument;
  }

  async saveInvitation(channel: PrivateChannel, invitation: AddInvitationDialogData): Promise<Invitation> {
    const privateKey = await this.passwordDialog('Save Invitation');
    const invite = new Invitation();
    invite.docIndex = channel.dkxInvite.documents.length + 1;
    invite.content = {
      kind: NostrKinds.PrivateChannelInvitation,
      docIndex: invite.docIndex,
      for: invitation.invitationType === 'pubkey' ? invitation.validPubkey : undefined,
      password: invitation.invitationType === 'password' ? invitation.password : undefined,
      pubkey: channel.dkxPost.signingParent.nostrPubKey,
      signingParent: channel.dkxPost.signingParent,
      cryptoParent: channel.dkxPost.cryptoParent,
    }
    const event = await channel.dkxInvite.createEvent(invite, privateKey);
    await this.dataService.publishEvent(event);
    return invite;
  }

  async resaveInvitation(channel: PrivateChannel, invite: Invitation, withKeys: boolean): Promise<Invitation> {
    const privateKey = await this.passwordDialog('Revoke Invitation');
    invite.content.signingParent = withKeys ? channel.dkxPost.signingParent : undefined;
    invite.content.cryptoParent = withKeys ? channel.dkxPost.cryptoParent : undefined;
    const event = await channel.dkxInvite.createEvent(invite, privateKey);
    await this.dataService.publishEvent(event);
    return invite;
  }

  async saveRSVP(channel: PrivateChannel) {
    const privateKey = await this.passwordDialog('Save RSVP');
    const rsvp = new Rsvp();
    rsvp.content = {
      kind: NostrKinds.PrivateChannelRSVP,
      pubkey: this.wallet.ownerPubKey,
      pointerDocIndex: channel.invitation.pointer.docIndex,
      type: channel.invitation.pointer.type,
    }
    const event1 = await channel.dkxRsvp.createEvent(rsvp, privateKey);
    await this.dataService.publishEvent(event1);

    rsvp.docIndex = channel.invitation.docIndex || (this.wallet.rsvps.length + 1 + walletRsvpDocumentsOffset);
    rsvp.content.signingKey = channel.invitation.pointer.signingKey;
    rsvp.content.cryptoKey = channel.invitation.pointer.cryptoKey;
    const event2 = await this.wallet.documentsIndex.createEvent(rsvp, privateKey);
    await this.dataService.publishEvent(event2);

    return true;
  }

  async deleteDocument(doc: ContentDocument, privateKey?: string) {
    privateKey = privateKey || await this.passwordDialog('Delete Document');
    const event = await doc.dkxParent.createDeleteEvent(doc, privateKey);
    if (doc.nostrEvent.pubkey !== event.pubkey) {
      this.snackBar.open(`Cannot delete another user's document.`, 'Hide', defaultSnackBarOpts);
      return false;
    }
    await this.dataService.publishEvent(event);
    return true;
  }
}


