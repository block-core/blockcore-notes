import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit } from 'nostr-tools';
import * as moment from 'moment';
import { EventValidation } from '../services/eventvalidation.service';
import { NostrEvent } from '../services/interfaces';

@Component({
  selector: 'app-identities',
  templateUrl: './identities.component.html',
})
export class IdentitiesComponent {
  publicKey?: string | null;

  constructor(public appState: ApplicationState, private validator: EventValidation, private utilities: Utilities, private router: Router) {
    // this.appState.title = 'Blockcore Notes';
    // this.appState.showBackButton = false;
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
  }

  ngAfterContentInit() {
    console.log('ngAfterContentInit');
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  events: NostrEvent[] = [];

  onConnected(relay: any) {
    const hourAgo = moment().subtract(1, 'hours').unix();
    const fiveMinutesAgo = moment().subtract(5, 'minutes').unix();

    //const sub = relay.sub([{ ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'] }], {  });
    const sub = relay.sub([{ kinds: [1], since: fiveMinutesAgo }], {});

    this.events = [];

    sub.on('event', (event: any) => {
      // Validate the event:
      const valid = this.validator.validateEvent(event);

      if (!valid) {
        debugger;
        console.log('INVALID EVENT!');
        return;
      }

      const parsed = this.validator.sanitizeEvent(event);
      // console.log('we got the event we wanted:', parsed);

      this.events.unshift(parsed);

      if (this.events.length > 100) {
        this.events.length = 80;
      }
    });
  }

  relay: any;

  async ngOnInit() {
    
    if (this.relay) {
      return;
    }

    // const relay = relayInit('wss://relay.nostr.info');
    this.relay = relayInit('wss://relay.damus.io');

    this.relay.on('connect', () => {
      console.log(`connected to ${this.relay.url}`);
      this.onConnected(this.relay);
    });

    this.relay.on('disconnect', () => {
      console.log(`DISCONNECTED! ${this.relay.url}`);
    });

    this.relay.on('notice', () => {
      console.log(`NOTICE FROM ${this.relay.url}`);
    });

    this.relay.connect();

    // sub.on('eose', () => {
    //   sub.unsub();
    // });
  }
}
