/// <reference lib="webworker" />

import { Event, relayInit, Filter, Sub } from 'nostr-tools';
import { NostrRelay, NostrRelaySubscription, NostrSub } from '../services/interfaces';
import { RelayRequest, RelayResponse } from '../services/messages';
import { Storage } from '../types/storage';

let relayWorker: RelayWorker;
let relay = undefined;
let storage = undefined;

addEventListener('message', async (ev: MessageEvent) => {
  console.log('MESSAGE RECEIVED IN RELAY WORKER!!', ev);

  // postMessage(ev.data);

  // storage = new Storage('blockcore-notes-' + '123', 1);
  // await storage.open();

  // // await this.storage.putCircle({ id: 1, name: 'Circle 1' });

  // // const circle = await storage.getCircle(1);
  // // console.log(circle);

  // // // await this.storage.putCircle({ id: 1, name: 'Circle 2' });

  // // const circle2 = await storage.getCircle(1);
  // // console.log(circle2);

  // await storage.putEvents({ contentCut: false, tagsCut: false, content: '', created_at: 50, pubkey: '123', kind: 1, id: '1', tags: [] });
  // await storage.putEvents({ contentCut: false, tagsCut: false, content: '', created_at: 100, pubkey: '123', kind: 1, id: '2', tags: [] });
  // await storage.putEvents({ contentCut: false, tagsCut: false, content: '', created_at: 101, pubkey: '123', kind: 1, id: '3', tags: [] });
  // await storage.putEvents({ contentCut: false, tagsCut: false, content: '', created_at: 199, pubkey: '123', kind: 1, id: '4', tags: [] });
  // await storage.putEvents({ contentCut: false, tagsCut: false, content: '', created_at: 200, pubkey: '123', kind: 1, id: '5', tags: [] });
  // await storage.putEvents({ contentCut: false, tagsCut: false, content: '', created_at: 201, pubkey: '123', kind: 1, id: '6', tags: [] });

  // const start = performance.now();

  // for (let index = 1; index < 10000; index++) {
  //   await storage.putEvents({ contentCut: false, tagsCut: false, content: '', created_at: index, pubkey: index.toString(), kind: 1, id: index.toString(), tags: [] });
  // }

  // const end = performance.now();
  // console.log(`Execution time: ${end - start} ms`);

  // const start2 = performance.now();

  // const events = await storage.getEventsByCreated('123', IDBKeyRange.bound(100, 200));
  // console.log('FOUND EVENTS:', events);

  // const end2 = performance.now();
  // console.log(`Execution time 2: ${end2 - start2} ms`);

  // const events2 = await storage.getEventsByCreated('123', IDBKeyRange.bound(0, 100));
  // console.log('FOUND EVENTS2:', events2);

  const request = ev.data as RelayRequest;

  switch (request.type) {
    case 'connect':
      // If the relay worker is already connected and valid, avoid re-creating.
      if (relayWorker && relayWorker.relay.status == 1) {
        console.log('Already connected...');
        break;
      } else {
        relayWorker = new RelayWorker(request.data.url);
        await relayWorker.connect();
        await relayWorker.info();
        // debugger;
        // relayWorker.subscribeAll(request.data.subscriptions);
        break;
      }
    case 'disconnect':
      await relayWorker.disconnect();
      // postMessage({ type: 'disconnect', result: true } as RelayResponse);
      break;
    case 'publish':
      await relayWorker.publish(request.data);
      break;
    case 'subscribe':
      debugger;
      await relayWorker.subscribe(request.data.filters, request.data.id);
      break;
    case 'unsubscribe':
      await relayWorker.unsubscribe(request.data);
      break;
    case 'terminate':
      await relayWorker.disconnect();
      postMessage({ type: 'terminated', url: relayWorker.url } as RelayResponse);
      break;
    // case 'initialize':
    //   relayWorker = new RelayWorker(request.data);
    //   await relayWorker.connect();
    //   // postMessage({ type: 'disconnect', result: true } as RelayResponse);
    //   break;
  }

  // const response = `worker response to ${data}`;
  // postMessage(response);
});

export class RelayWorker {
  relay!: NostrRelay;

  /** These are the subscription instances connected to the relay. */
  // subs: NostrSub[] = [];
  /** These are the subscriptions the app has requested and manages. */
  subscriptions: NostrRelaySubscription[] = [];

  constructor(public url: string) {}

  async publish(event: Event) {
    let pub = this.relay.publish(event);
    pub.on('ok', () => {
      console.log(`${this.relay.url} has accepted our event`);
    });
    pub.on('seen', () => {
      console.log(`we saw the event on ${this.relay.url}`);
    });
    pub.on('failed', (reason: any) => {
      console.log(`failed to publish to ${this.relay.url}: ${reason}`);
    });
  }

  async connect() {
    // const relay = relayInit('wss://relay.nostr.info');
    const relay = relayInit(this.url) as NostrRelay;
    // relay.subscriptions = [];

    relay.on('connect', () => {
      console.log(`connected to ${relay?.url}`);
      postMessage({ type: 'status', data: 1, url: relay.url } as RelayResponse);
      // onConnected(relay);
      //this.onConnected(relay);
    });

    relay.on('disconnect', () => {
      console.log(`DISCONNECTED! ${relay?.url}`);
      debugger;
      this.subscriptions = [];
      postMessage({ type: 'status', data: 0, url: relay.url } as RelayResponse);
    });

    relay.on('notice', (msg: any) => {
      console.log(`NOTICE FROM ${relay?.url}: ${msg}`);
      postMessage({ type: 'notice', data: msg, url: relay.url } as RelayResponse);
    });

    // Keep a reference of the metadata on the relay instance.
    // relay.metadata = server;

    // if (relay.metadata.enabled == undefined) {
    //   relay.metadata.enabled = true;
    // }

    try {
      // if (relay.metadata.enabled) {
      await relay.connect();
      // }
    } catch (err) {
      postMessage({ relay: this, error: 'Unable to connect.' });
      console.log(err);
      return;
      // relay.metadata.error = 'Unable to connect.';
    }

    this.relay = relay;
    // await this.addRelay(relay);
  }

  async disconnect() {
    // this.subscriptions = [];
    return this.relay.close();
  }

  unsubscribe(id: string) {
    const index = this.subscriptions.findIndex((s) => s.id === id);

    if (index == -1) {
      return;
    }

    const sub = this.subscriptions[index];
    this.subscriptions.splice(index, 1);

    // Unsub from the relay.
    sub.sub?.unsub();
    console.log('Unsubscribed: ', id);
  }

  // subscribeAll(subscriptions: NostrRelaySubscription[]) {
  //   debugger;

  //   if (!subscriptions) {
  //     return;
  //   }

  //   for (let index = 0; index < subscriptions.length; index++) {
  //     const sub = subscriptions[index];
  //     this.subscribe(sub.filters, sub.id);
  //   }
  // }

  subscribe(filters: Filter[], id: string) {
    console.log('SUBSCRIBE....');

    if (!this.relay) {
      console.warn('This relay does not have active connection and subscription cannot be created at this time.');
      return;
    }

    // Skip if the subscription is already added.
    if (this.subscriptions.findIndex((s) => s.id == id) > -1) {
      debugger;
      console.log('This subscription is already added!');
      return;
    }

    const sub = this.relay.sub(filters) as NostrSub;
    // sub.id = id;

    console.log('SUBSCRIPTION:', sub);
    this.subscriptions.push({ id: id, filters: filters, sub: sub });

    // const sub = relay.sub(filters, {}) as NostrSubscription;
    // relay.subscriptions.push(sub);

    sub.on('event', (originalEvent: any) => {
      postMessage({ url: this.url, type: 'event', data: originalEvent } as RelayResponse);
      // const event = this.eventService.processEvent(originalEvent);
      // if (!event) {
      //   return;
      // }
      // observer.next(event);
    });

    sub.on('eose', () => {
      console.log('eose on:', this.url);
    });

    // return () => {
    //   console.log('subscribeToRelay:finished:unsub');
    //   // When the observable is finished, this return function is called.
    //   sub.unsub();
    //   const subIndex = relay.subscriptions.findIndex((s) => s == sub);
    //   if (subIndex > -1) {
    //     relay.subscriptions.splice(subIndex, 1);
    //   }
    // };
  }

  async info() {
    try {
      const url = new URL(this.url);
      const infoUrl = `https://${url.hostname}`;

      const rawResponse = await fetch(infoUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'application/nostr+json',
        },
      });

      if (rawResponse.status === 200) {
        const content = await rawResponse.json();
        postMessage({ type: 'nip11', data: content, url: this.url } as RelayResponse);
      } else {
        postMessage({ type: 'nip11', data: { error: `Unable to get NIP-11 data. Status: ${rawResponse.statusText}` }, url: this.url } as RelayResponse);
      }
    } catch (err) {
      console.warn(err);
      postMessage({ type: 'nip11', data: { error: `Unable to get NIP-11 data. Status: ${err}` }, url: this.url } as RelayResponse);
    }
  }
}
