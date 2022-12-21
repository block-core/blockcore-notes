import { Component } from '@angular/core';
// import { relayInit, validateEvent, verifySignature, signEvent, getEventHash, getPublicKey } from 'nostr-tools';
import { relayInit } from 'nostr-tools';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
})
export class NotesComponent {
  constructor() {}

  ngOnInit() {
    // const pool = relayPool();
    // pool.addRelay('wss://relay.nostr.info', { read: true, write: true });
    // pool.addRelay('wss://nostr.openchain.fr', { read: true, write: true });
    // // pool.addRelay('wss://relay.damus.io', {read: true, write: true});
    // pool.addRelay('wss://nostr-relay.wlvs.space', { read: true, write: true });
    // pool.addRelay('wss://relay.nostr.ch', { read: true, write: true });
    // pool.addRelay('wss://nostr.sandwich.farm', { read: true, write: true });

    // console.log('DOES THIS HAPPEN?!?!');

    // const relay = relayInit('wss://relay.nostr.info');

    // relay.on('connect', () => {
    //   console.log(`connected to ${relay.url}`);
    // });

    // relay.on('disconnect', () => {
    //   console.log(`DISCONNECTED! ${relay.url}`);
    // });

    // relay.on('notice', () => {
    //   console.log(`NOTICE FROM ${relay.url}`);
    // });

    // relay.connect();

    // // let's query for an event that exists
    // let sub = relay.sub([
    //   {
    //     ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'],
    //   },
    // ]);
    // sub.on('event', (event) => {
    //   console.log('we got the event we wanted:', event);
    // });
    // sub.on('eose', () => {
    //   sub.unsub();
    // });
  }
}
