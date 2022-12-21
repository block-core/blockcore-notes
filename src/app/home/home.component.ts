import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit } from 'nostr-tools';
import * as moment from 'moment';
import { EventValidation } from '../services/eventvalidation.service';
import { NostrEvent } from '../services/interfaces';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(public appState: ApplicationState, private validator: EventValidation, private utilities: Utilities, private router: Router) {
    this.appState.title = 'Blockcore Notes';
    this.appState.showBackButton = false;
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  events: NostrEvent[] = [];

  async ngOnInit() {
    const publicKey = localStorage.getItem('blockcore:notes:nostr:pubkey');

    if (publicKey) {
      this.appState.publicKeyHex = publicKey;
      this.appState.publicKey = this.utilities.getNostrIdentifier(publicKey);
      this.appState.short = this.appState.publicKey.substring(0, 10) + '...'; // TODO: Figure out a good way to minimize the public key, "5...5"?
      this.appState.authenticated = true;
    }

    // TODO: Initialize of extension can take time, first load we wait longer to see if extension is there. After
    // initial verification that user has extension (this happens on Connect component), then we persist some state
    // and assume extension is approve (when we have pubkey available).
    if (this.appState.authenticated) {
      // this.router.navigateByUrl('/notes');
    } else {
      this.router.navigateByUrl('/connect');
    }

    // const relay = relayInit('wss://relay.nostr.info');
    const relay = relayInit('wss://relay.damus.io');

    relay.on('connect', () => {
      console.log(`connected to ${relay.url}, ${relay.status}`);
    });

    relay.on('disconnect', () => {
      console.log(`DISCONNECTED! ${relay.url}`);
    });

    relay.on('notice', () => {
      console.log(`NOTICE FROM ${relay.url}`);
    });

    relay.connect();

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

    // sub.on('eose', () => {
    //   sub.unsub();
    // });
  }
}
