import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { bech32 } from '@scure/base';
import {
  ContentDocument, HDKey, getNowSeconds, Nip76WalletConstructorArgs,
  HDKIndex, HDKIndexDTO, HDKIndexType, Invitation, nip19Extension, Nip76Wallet,
  Nip76WebWalletStorage, NostrKinds, PostDocument, PrivateChannel, Rsvp, Versions, walletRsvpDocumentsOffset, NostrEventDocument,
  SequentialKeysetDTO
} from 'animiq-nip76-tools';
import * as nostrTools from 'nostr-tools';
import { filter, firstValueFrom, Subject, take } from 'rxjs';
import { DataService } from '../services/data';
import { NostrEvent, NostrProfileDocument, NostrRelaySubscription } from '../services/interfaces';
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
  profile!: NostrProfileDocument;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private security: SecurityService,
    private profileService: ProfileService,
    private relayService: RelayService,
    private dataService: DataService,
    private ui: UIService
  ) {
    this.profileService.profile$.pipe(filter(x => !!x), take(1)).subscribe(profile => {
      this.profile = profile!;
      this.loadWallet();
    });
  }

  get extensionProvider(): any {
    return (globalThis as any).nostr?.nip76;
  }

  async loadWallet() {
    const publicKey = this.profile.pubkey;
    if (this.extensionProvider) {
      const args = await this.extensionProvider.getWalletArgs();
      const rootKey = HDKey.parseExtendedKey(args.rootKey);
      const wordset = Uint32Array.from(args.wordset);
      const documentsIndex: HDKIndex = HDKIndex.fromJSON(args.documentsIndex);
      const walletArgs: Nip76WalletConstructorArgs = {
        publicKey: args.publicKey,
        wordset,
        rootKey,
        documentsIndex,
        store: {} as Nip76WebWalletStorage,
        isGuest: false,
        isInSession: true,
      };
      this.wallet = new Nip76Wallet(walletArgs);
      setTimeout(() => { this.loadDocuments(); }, 500);
    } else if (localStorage.getItem(nostrPrivKeyAddress)) {
      if (localStorage.getItem(Nip76WebWalletStorage.backupKey)) {
        Nip76WebWalletStorage.fromStorage({ publicKey }).then(wallet => {
          this.wallet = wallet;
          if (this.wallet.isInSession) {
            setTimeout(() => { this.loadDocuments(); }, 500);
          } else if (!this.wallet.isGuest) {
            this.login();
          }
        });
      } else {
        const privateKey = await this.passwordDialog('Create an HD Wallet');
        this.wallet = await Nip76WebWalletStorage.fromStorage({ publicKey, privateKey });
        this.wallet.saveWallet(privateKey);
        location.reload();
      }
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

  loadDocuments(start = 0) {
    const channelPubkeys = this.wallet.documentsIndex.getSequentialKeyset(0, 0);
    const invitePubkeys = this.wallet.documentsIndex.getSequentialKeyset(walletRsvpDocumentsOffset, 0);
    if (this.documentsSubscription) {
      this.relayService.unsubscribe(this.documentsSubscription.id);
    }
    const privateDoc$ = new Subject<NostrEvent>();
    privateDoc$.subscribe(async nostrEvent => {
      let docIndex = channelPubkeys.keys.findIndex(x => x.signingKey?.nostrPubKey === nostrEvent.pubkey) + start;
      if (docIndex > -1) {
        const doc = await this.wallet.documentsIndex.readEvent(nostrEvent, docIndex) as PrivateChannel;
        if(this.extensionProvider) {
          const dkxInviteDTO = await this.extensionProvider.getInvitationIndex(docIndex);
          doc.dkxInvite = HDKIndex.fromJSON(dkxInviteDTO);
        }
        if (doc) {
          this.loadChannel(doc);
        }
      } else {
        docIndex = invitePubkeys.keys.findIndex(x => x.signingKey?.nostrPubKey === nostrEvent.pubkey) + start + walletRsvpDocumentsOffset;
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
      { authors: channelPubkeys.keys.map(x => x.signingKey?.nostrPubKey!), kinds: [17761], limit: channelPubkeys.keys.length },
      { authors: invitePubkeys.keys.map(x => x.signingKey?.nostrPubKey!), kinds: [17761], limit: invitePubkeys.keys.length }
    ];
    this.documentsSubscription = this.relayService.subscribe(filters,
      `nip76Service.loadDocuments.${start}-${length}`, 'Replaceable', privateDoc$);
  }

  loadChannel(channel: PrivateChannelWithRelaySub, start = 0) {
    const invitePubs = channel.dkxInvite?.getSequentialKeyset(0, 0);
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
        const docIndex = invitePubs.keys.findIndex(x => x.signingKey?.nostrPubKey === nostrEvent.pubkey) + start;
        const invite = await channel.dkxInvite.readEvent(nostrEvent, docIndex);
      }
    });
    const filters: nostrTools.Filter[] = [
      { '#e': [channel.dkxPost.eventTag], kinds: [17761], limit: 100 },
      { '#e': [channel.dkxRsvp.eventTag], kinds: [17761], limit: 100 },
    ];
    if (invitePubs) {
      filters.push({ authors: invitePubs.keys.map(x => x.signingKey?.nostrPubKey!), kinds: [17761], limit: invitePubs.keys.length })
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
    if (!invite.content.signingParent && !invite.content.encryptParent) {
      this.snackBar.open(`Encountered a suspended invitation from ${invite.ownerPubKey}`, 'Hide', defaultSnackBarOpts);
      return undefined;
    }
    const channelIndex = new HDKIndex(HDKIndexType.Singleton, invite.content.signingParent!, invite.content.encryptParent!);
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
      let pointer: nip19Extension.PrivateChannelPointer;

      if ((pointerType & nip19Extension.PointerType.SharedSecret) == nip19Extension.PointerType.SharedSecret) {
        if (this.extensionProvider) {
          const pointerDTO = await this.extensionProvider.readInvitation(channelPointer);
          pointer = nip19Extension.pointerFromDTO(pointerDTO);
        } else {
          secret = await this.passwordDialog('Preview Private Invitation');
          const p = await nip19Extension.decode(channelPointer, secret!);
          pointer = p.data as nip19Extension.PrivateChannelPointer;
        }
      } else {
        const p = await nip19Extension.decode(channelPointer, secret!);
        pointer = p.data as nip19Extension.PrivateChannelPointer;
      }

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
            encryptParent: cryptoParent
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
    channel.content.created_at = channel.content.created_at || channel?.nostrEvent.created_at || getNowSeconds();
    let event: NostrEventDocument;
    if (this.extensionProvider) {
      event = await this.extensionProvider.createEvent(this.wallet.documentsIndex, channel);
    } else {
      privateKey = privateKey || await this.passwordDialog('Save Channel Details');
      event = await this.wallet.documentsIndex.createEvent(channel, privateKey);
    }
    await this.dataService.publishEvent(event);
    return true;
  }

  async saveNote(channel: PrivateChannel, text: string) {
    const postDocument = new PostDocument();
    postDocument.content = {
      text,
      pubkey: this.wallet.ownerPubKey,
      kind: nostrTools.Kind.Text
    }
    let event: NostrEventDocument;
    if (this.extensionProvider) {
      event = await this.extensionProvider.createEvent(channel.dkxPost, postDocument);
    } else {
      const privateKey = await this.passwordDialog('Save Note');
      event = await channel.dkxPost.createEvent(postDocument, privateKey);
    }
    await this.dataService.publishEvent(event);
    return true;
  }

  async saveReaction(post: PostDocument, text: string, kind: nostrTools.Kind): Promise<PostDocument> {
    const postDocument = new PostDocument();
    postDocument.content = {
      kind,
      pubkey: this.wallet.ownerPubKey,
      text,
      tags: [['e', post.nostrEvent.id]]
    };
    let event: NostrEventDocument;
    if (this.extensionProvider) {
      event = await this.extensionProvider.createEvent(post.dkxParent, postDocument);
    } else {
      const privateKey = await this.passwordDialog('Save ' + (kind === nostrTools.Kind.Reaction ? 'Reaction' : 'Reply'));
      event = await post.dkxParent.createEvent(postDocument, privateKey);
    }
    await this.dataService.publishEvent(event);
    return postDocument;
  }

  async saveInvitation(channel: PrivateChannel, invitation: AddInvitationDialogData): Promise<Invitation> {
    const invite = new Invitation();
    invite.docIndex = channel.dkxInvite.documents.length + 1;
    invite.content = {
      kind: NostrKinds.PrivateChannelInvitation,
      docIndex: invite.docIndex,
      for: invitation.invitationType === 'pubkey' ? invitation.validPubkey : undefined,
      password: invitation.invitationType === 'password' ? invitation.password : undefined,
      pubkey: channel.dkxPost.signingParent.nostrPubKey,
      signingParent: channel.dkxPost.signingParent,
      encryptParent: channel.dkxPost.encryptParent,
    };
    let event: NostrEventDocument;
    if (this.extensionProvider) {
      event = await this.extensionProvider.createEvent(channel.dkxInvite, invite);
    } else {
      const privateKey = await this.passwordDialog('Save Invitation');
      event = await channel.dkxInvite.createEvent(invite, privateKey);
    }
    await this.dataService.publishEvent(event);
    return invite;
  }

  async resaveInvitation(channel: PrivateChannel, invite: Invitation, withKeys: boolean): Promise<Invitation> {
    invite.content.signingParent = withKeys ? channel.dkxPost.signingParent : undefined;
    invite.content.encryptParent = withKeys ? channel.dkxPost.encryptParent : undefined;
    let event: NostrEventDocument;
    if (this.extensionProvider) {
      event = await this.extensionProvider.createEvent(channel.dkxInvite, invite);
    } else {
      const privateKey = await this.passwordDialog((withKeys ? 'Reinstate' : 'Suspend') + ' Invitation');
      event = await channel.dkxInvite.createEvent(invite, privateKey);
    }
    await this.dataService.publishEvent(event);
    return invite;
  }

  async saveRSVP(channel: PrivateChannel) {
    const rsvp = new Rsvp();
    rsvp.content = {
      kind: NostrKinds.PrivateChannelRSVP,
      pubkey: this.wallet.ownerPubKey,
      pointerDocIndex: channel.invitation.pointer.docIndex,
      type: channel.invitation.pointer.type,
    };
    let event1: NostrEventDocument;
    let privateKey: string;
    if (this.extensionProvider) {
      event1 = await this.extensionProvider.createEvent(channel.dkxRsvp, rsvp);
    } else {
      privateKey = await this.passwordDialog('Save RSVP');
      event1 = await channel.dkxRsvp.createEvent(rsvp, privateKey);
    }
    await this.dataService.publishEvent(event1);

    rsvp.docIndex = channel.invitation.docIndex || (this.wallet.rsvps.length + 1 + walletRsvpDocumentsOffset);
    rsvp.content.signingKey = channel.invitation.pointer.signingKey;
    rsvp.content.cryptoKey = channel.invitation.pointer.cryptoKey;
    let event2: NostrEventDocument;
    if (this.extensionProvider) {
      event2 = await this.extensionProvider.createEvent(this.wallet.documentsIndex, rsvp);
    } else {
      event2 = await this.wallet.documentsIndex.createEvent(rsvp, privateKey!);
    }
    await this.dataService.publishEvent(event2);

    return true;
  }

  async deleteDocument(doc: ContentDocument, privateKey?: string) {
    let event: NostrEventDocument;
    if (this.extensionProvider) {
      event = await this.extensionProvider.createDeleteEvent(doc);
    } else {
      privateKey = privateKey || await this.passwordDialog('Delete Document');
      event = await doc.dkxParent.createDeleteEvent(doc, privateKey);
    }
    if (doc.nostrEvent.pubkey !== event.pubkey) {
      this.snackBar.open(`Cannot delete another user's document.`, 'Hide', defaultSnackBarOpts);
      return false;
    }
    await this.dataService.publishEvent(event);
    return true;
  }
}


