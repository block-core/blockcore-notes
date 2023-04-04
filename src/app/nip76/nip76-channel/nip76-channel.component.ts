import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ContentDocument, Invitation, Nip76Wallet, PostDocument, PrivateChannel, Rsvp } from 'animiq-nip76-tools';
import { CircleService } from 'src/app/services/circle';
import { Circle, NostrProfileDocument } from 'src/app/services/interfaces';
import { ProfileService } from 'src/app/services/profile';
import { defaultSnackBarOpts, Nip76Service } from '../nip76.service';

enum DisplayType {
  Summary = 'Summary',
  Edit = 'Edit',
  RSVPs = 'RSVPs',
  Invitations = 'Invitations',
  Notes = 'Notes',
}

@Component({
  selector: 'app-nip76-channel',
  templateUrl: './nip76-channel.component.html',
  styleUrls: ['./nip76-channel.component.scss']
})
export class Nip76ChannelHeaderComponent {
  private _channel?: PrivateChannel;
  private _displayType = DisplayType.Summary;
  DisplayType = DisplayType;
  imagePath = '/assets/profile.png';
  profileName = '';
  profile?: NostrProfileDocument;
  circle?: Circle;

  @Input() displayName = true;
  @Input() showDisplayOptions = true;
  @Input() listType = 'list';
  @Input() iconSize = 'small';

  constructor(
    private profiles: ProfileService,
    private circleService: CircleService,
    private snackBar: MatSnackBar,
    public nip76Service: Nip76Service,
    private router: Router
  ) { }

  @Input()
  set displayType(val: 'Summary' | 'Edit' | 'RSVPs' | 'Invitations' | 'Notes') {
    this._displayType = DisplayType[val]
  }

  get displayType(): DisplayType {
    return this._displayType!;
  }

  @Input()
  set channel(val: PrivateChannel) {
    this._channel = val;
    if (val.editing) {
      this._displayType = DisplayType.Edit;
    }
    this.profiles.getProfile(val.ownerPubKey).then(async (profile) => {
      this.profile = profile;
      await this.updateProfileDetails();
    });
  }

  get channel(): PrivateChannel {
    return this._channel!;
  }

  get wallet(): Nip76Wallet {
    return this.nip76Service.wallet;
  }

  get pubkey(): string {
    return this.channel.dkxPost.signingParent.nostrPubKey;
  }

  get isOwner(): boolean {
    return !!this.channel.dkxPost.signingParent.privateKey;
  }

  async updateProfileDetails() {
    this.imagePath = this.channel.content.picture || this.profile?.picture || this.imagePath;
    if (this.profile) {
      this.profileName = this.profile.display_name || this.profile.name || this.profileName;
      this.circle = await this.circleService.get(this.profile.circle);
    }
  }

  viewNotes() {
    this.router.navigate(['/private-channels', this.pubkey, 'notes'])
  }

  async saveChannel() {
    const success = await this.nip76Service.saveChannel(this.channel!);
  }

  cancelAdd() {
    const index = this.wallet.documentsIndex.documents.findIndex(x => this.channel);
    this.wallet.documentsIndex.documents.splice(index, 1);
  }

  async copyKeys(invite: Invitation) {
    navigator.clipboard.writeText(await invite.getPointer());
    this.snackBar.open(`The invitation is now in your clipboard.`, 'Hide', defaultSnackBarOpts);
  }

  async deleteRSVP(rsvp: Rsvp) {
    const privateKey = await this.nip76Service.passwordDialog('Delete RSVP');
    if (privateKey) {
      const walletRsvp = this.wallet.rsvps.find(x => x.content.pubkey === this.wallet.ownerPubKey && x.content.pointerDocIndex === rsvp.content.pointerDocIndex);
      if (await this.nip76Service.deleteDocument(rsvp, privateKey)) {
        rsvp.dkxParent.documents.splice(rsvp.dkxParent.documents.indexOf(rsvp), 1);
        if (walletRsvp) {
          if (await this.nip76Service.deleteDocument(walletRsvp, privateKey)) {
            walletRsvp.dkxParent.documents.splice(walletRsvp.dkxParent.documents.indexOf(walletRsvp), 1);
          }
        }
      }
    }
  }

  async deleteInvitation(invite: Invitation) {
    const privateKey = await this.nip76Service.passwordDialog('Delete Invitation');
    if (privateKey) {
      if (await this.nip76Service.deleteDocument(invite, privateKey)) {
        invite.dkxParent.documents.splice(invite.dkxParent.documents.indexOf(invite), 1);
      }
    }
  }

  async deleteChannelRSVP(channel: PrivateChannel) {
    if (channel.invitation?.pointer?.docIndex) {
      const rsvp = this.wallet.rsvps.find(x => x.channel === channel
        && x.content.pointerDocIndex === channel.invitation.pointer.docIndex) as Rsvp;
      await this.deleteRSVP(rsvp);
    }

  }

}
