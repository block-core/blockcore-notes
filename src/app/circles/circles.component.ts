import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { StorageService } from '../services/storage.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
})
export class CirclesComponent {
  publicKey?: string | null;
  loading = false;
  searchTerm: any;
  constructor(public appState: ApplicationState, private storage: StorageService, private profile: ProfileService, private validator: DataValidation, private utilities: Utilities, private router: Router) {
    this.appState.title = 'Circles';
    this.appState.showBackButton = false;
  }

  async clearIdentities() {
    await this.profile.wipe();
    this.profiles = [];
    await this.load();
  }

  // public trackByFn(index: number, item: NostrProfileDocument) {
  //   return item.id;
  // }

  // events: NostrEvent[] = [];

  // onConnected(relay: any) {
  //   const hourAgo = moment().subtract(1, 'hours').unix();
  //   const fiveMinutesAgo = moment().subtract(5, 'minutes').unix();

  //   //const sub = relay.sub([{ ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'] }], {  });
  //   this.sub = relay.sub([{ kinds: [0], since: fiveMinutesAgo }], {});

  //   this.events = [];

  //   this.sub.on('event', (event: any) => {
  //     // Validate the event:
  //     const valid = this.validator.validateEvent(event);

  //     if (!valid) {
  //       debugger;
  //       console.log('INVALID EVENT!');
  //       return;
  //     }

  //     const parsed = this.validator.sanitizeEvent(event);
  //     // console.log('we got the event we wanted:', parsed);

  //     this.events.unshift(parsed);

  //     if (this.events.length > 100) {
  //       this.events.length = 80;
  //     }
  //   });
  // }

  // relay: any;
  // sub: any;

  ngOnDestroy() {
    // if (this.sub) {
    //   this.sub.unsub();
    // }
  }

  profiles: NostrProfileDocument[] = [];

  async load() {
    this.loading = true;
    // setTimeout(async () => {
    this.profiles = await this.profile.followList();
    // });

    this.loading = false;
  }

  async ngOnInit() {
    await this.load();

    // if (this.relay) {
    //   return;
    // }
    // // const relay = relayInit('wss://relay.nostr.info');
    // this.relay = relayInit('wss://relay.damus.io');
    // this.relay.on('connect', () => {
    //   console.log(`connected to ${this.relay.url}`);
    //   this.onConnected(this.relay);
    // });
    // this.relay.on('disconnect', () => {
    //   console.log(`DISCONNECTED! ${this.relay.url}`);
    // });
    // this.relay.on('notice', () => {
    //   console.log(`NOTICE FROM ${this.relay.url}`);
    // });
    // this.relay.connect();
    // sub.on('eose', () => {
    //   sub.unsub();
    // });
  }

  // about
  // display_name
  // name
  // pubkey
  async search() {
    const text: string = this.searchTerm;

    if (text == 'undefined' || text == null || text == '') {
      this.loading = true;
      this.profiles = await this.profile.followList();
      this.loading = false;
    } else {
      this.loading = true;
      const allprofiles = await this.profile.followList();
      this.profiles = allprofiles.filter((item: any) => item.name === text || item.display_name === text || item.about === text || item.pubkey === text);
      this.loading = false;
    }
  }
}
