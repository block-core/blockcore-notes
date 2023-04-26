import { Component, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invitation, Nip76Wallet, PostDocument, PrivateChannel, Rsvp } from 'animiq-nip76-tools';
import { CircleService } from 'src/app/services/circle';
import { Circle, NostrProfileDocument } from 'src/app/services/interfaces';
import { ProfileService } from 'src/app/services/profile';
import { defaultSnackBarOpts, Nip76Service } from '../nip76.service';

@Component({
  selector: 'app-nip76-rsvps-sent',
  templateUrl: './nip76-rsvps-sent.component.html',
  styleUrls: ['./nip76-rsvps-sent.component.scss']
})
export class Nip76RsvpsSentComponent {

  constructor(
    private profiles: ProfileService,
    private circleService: CircleService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    public nip76Service: Nip76Service
  ) { }

  get wallet(): Nip76Wallet {
    return this.nip76Service.wallet;
  }

  async deleteRSVP(rsvp: Rsvp) {
    const privateKeyRequired = !this.nip76Service.extensionProvider;
    const privateKey = privateKeyRequired ? await this.nip76Service.passwordDialog('Delete RSVP') : undefined;
    if (privateKey) {
      const channelRsvp = rsvp.channel?.rsvps.find(x => x.content.pubkey === this.wallet.ownerPubKey && x.content.pointerDocIndex === rsvp.content.pointerDocIndex);
      if (await this.nip76Service.deleteDocument(rsvp, privateKey)) {
        rsvp.dkxParent.documents.splice(rsvp.dkxParent.documents.indexOf(rsvp), 1);
        if (channelRsvp) {
          if (await this.nip76Service.deleteDocument(channelRsvp, privateKey)) {
            channelRsvp.dkxParent.documents.splice(channelRsvp.dkxParent.documents.indexOf(channelRsvp), 1);
          }
        }
      }
    }
  }
}
