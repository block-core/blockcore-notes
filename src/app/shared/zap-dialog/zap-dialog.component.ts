import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Event, getEventHash, Kind, UnsignedEvent, validateEvent, verifySignature } from 'nostr-tools';
import { ApplicationState } from 'src/app/services/applicationstate';
import { RelayService } from 'src/app/services/relay';
import { EventService } from 'src/app/services/event';
import { NostrService } from 'src/app/services/nostr';
import { Utilities } from 'src/app/services/utilities';
import { DataService } from 'src/app/services/data';
import { ZapQrCodeComponent } from '../zap-qr-code/zap-qr-code.component';
import { NostrProfileDocument, LNURLPayRequest, LNURLInvoice, NostrEventDocument, NostrRelayDocument } from 'src/app/services/interfaces';
import { StorageService } from 'src/app/services/storage';

export interface ZapDialogData {
  profile: NostrProfileDocument;
  event?: NostrEventDocument;
}

@Component({
  selector: 'app-zap-dialog',
  templateUrl: './zap-dialog.component.html',
  styleUrls: ['./zap-dialog.component.scss'],
})
export class ZapDialogComponent implements OnInit {
  sendZapForm!: UntypedFormGroup;
  minSendable: number = 0;
  maxSendable: number = 0;
  profile!: NostrProfileDocument;
  amount: number = 0;
  comment = '';
  payRequest: LNURLPayRequest | null = null;
  invoice: LNURLInvoice = {
    pr: '',
  };

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  error: string = '';
  event?: NostrEventDocument | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ZapDialogData,
    private formBuilder: UntypedFormBuilder,
    private eventService: EventService,
    private relayService: RelayService,
    private nostr: NostrService,
    private util: Utilities,
    private db: StorageService,
    private dataService: DataService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ZapDialogComponent>
  ) {}

  async ngOnInit() {
    this.profile = this.data.profile;
    this.event = this.data.event;
    this.sendZapForm = this.formBuilder.group({
      amount: ['', [Validators.required]],
      comment: [''],
    });

    this.fetchPayReq();

    await this.updateProfileDetails();
  }

  canZap = true;
  loading = true;

  async fetchPayReq(): Promise<void> {
    this.payRequest = await this.fetchZapper();

    if (!this.payRequest) {
      this.canZap = false;
    } else {
      this.canZap = true;
    }

    this.loading = false;

    this.recofigureFormValidators();
  }

  async fetchZapper(): Promise<LNURLPayRequest | null> {
    let staticPayReq = '';
    if (!this.profile.lud16 && this.profile.lud06 && this.profile.lud06.indexOf('@') > -1) {
      const parts = this.profile.lud06.split('@');
      staticPayReq = `https://${parts[1]}/.well-known/lnurlp/${parts[0]}`;
    } else if (this.profile.lud16) {
      const parts = this.profile.lud16.split('@');
      staticPayReq = `https://${parts[1]}/.well-known/lnurlp/${parts[0]}`;
    } else if (this.profile.lud06 && this.profile.lud06.toLowerCase().startsWith('lnurl')) {
      staticPayReq = this.util.convertBech32ToText(this.profile.lud06).toString();
    }

    if (staticPayReq.length !== 0) {
      try {
        const resp = await fetch(staticPayReq);
        if (resp.ok) {
          const payReq = await resp.json();
          if (payReq.status === 'ERROR') {
            this.error = payReq.reason ? payReq.reason : 'Error fetching the invoice - please try again later';
          } else {
            return payReq;
          }
        }
      } catch (err) {
        this.error = 'Error fetching the invoice - please try again later';
      }
    }

    return null;
  }

  async onSubmit() {
    if (this.sendZapForm.valid) {
      let comment = this.sendZapForm.get('comment')?.value;
      let amount = this.sendZapForm.get('amount')?.value;
      if (!amount || !this.payRequest) {
        console.log('error: please enter an amount and  a valid pay request');
      } else {
        const callback = new URL(this.payRequest.callback);
        const query = new Map<string, string>();
        query.set('amount', Math.floor(amount * 1000).toString());
        if (comment && this.payRequest?.commentAllowed) {
          query.set('comment', comment);
        }

        let zapReqEvent;
        if (this.payRequest.nostrPubkey)
          if (this.profile.pubkey) {
            let note = this.event?.id ? this.event.id : null;
            zapReqEvent = await this.createZapEvent(this.profile.pubkey, note, comment);
            query.set('nostr', JSON.stringify(zapReqEvent));
          }

        const baseUrl = `${callback.protocol}//${callback.host}${callback.pathname}`;
        const queryJoined = [...query.entries()].map((val) => `${val[0]}=${encodeURIComponent(val[1])}`).join('&');

        try {
          const response = await fetch(`${baseUrl}?${queryJoined}`);
          if (response.ok) {
            const result = await response.json();
            if (result.status === 'ERROR') {
              this.error = result.reason ? result.reason : 'Error fetching the invoice - please try again later';
            } else {
              this.invoice = result;
              this.dialog.open(ZapQrCodeComponent, {
                width: '400px',
                data: {
                  invoice: this.invoice,
                  profile: this.profile,
                },
              });
              this.dialogRef.close(ZapDialogComponent);
            }
          } else {
            this.error = 'Error fetching the invoice - please try again later';
          }
        } catch (err) {
          this.error = 'Error fetching the invoice - please try again later';
        }
      }
    }
  }
  items: NostrRelayDocument[] = [];

  async createZapEvent(targetPubKey: string, note?: any, msg?: string) {
    let zapEvent = this.dataService.createEvent(Kind.ZapRequest, '');

    zapEvent.content = msg ? msg : '';
    Object.assign([], zapEvent.tags);
    if (note) {
      zapEvent.tags.push(['e', note]);
    }
    zapEvent.tags.push(['p', targetPubKey]);

    // zapEvent.tags.push(['relays', ...Object.keys(this.relayService)]);
    zapEvent = await this.addRelaysTag(zapEvent);
    const signedEvent = await this.createAndSignEvent(zapEvent);

    if (!signedEvent) {
      return;
    }

    return signedEvent;
  }

  async addRelaysTag(zapEvent: UnsignedEvent) {
    debugger;
    this.items = await this.db.storage.getRelays();
    const relays = this.items.map((item) => item.url);
    zapEvent.tags.push(['relays', ...relays]);
    return zapEvent;
  }
  private async createAndSignEvent(originalEvent: UnsignedEvent) {
    let signedEvent = originalEvent as Event;

    signedEvent.id = getEventHash(originalEvent);
    signedEvent = await this.nostr.sign(originalEvent);

    const event = this.eventService.processEvent(signedEvent as NostrEventDocument);

    if (!event) {
      throw new Error('The event is not valid. Cannot publish.');
    }

    let ok = validateEvent(signedEvent);

    if (!ok) {
      throw new Error('The event is not valid. Cannot publish.');
    }

    let veryOk = await verifySignature(event as any);

    if (!veryOk) {
      throw new Error('The event signature not valid. Maybe you choose a different account than the one specified?');
    }

    return event;
  }

  private recofigureFormValidators() {
    this.minSendable = (this.payRequest?.minSendable || 1000) / 1000;
    this.maxSendable = (this.payRequest?.maxSendable || 21_000_000_000) / 1000;
    this.sendZapForm.get('amount')?.setValidators([Validators.min((this.payRequest?.minSendable || 1000) / 1000), Validators.max((this.payRequest?.maxSendable || 21_000_000_000) / 1000), Validators.required]);
  }

  private async updateProfileDetails() {
    if (!this.profile) {
      return;
    }
    if (this.profile.picture) {
      this.imagePath = this.profile.picture;
    }
    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;
    this.profileName = this.profile.display_name || this.profile.name || this.util.getNostrIdentifier(this.profile.pubkey);
  }

  setAmount(amount: number) {
    this.sendZapForm.get('amount')?.setValue(amount);
  }
}
