/// <reference lib="webworker" />

import { Event, relayInit, Filter, Sub } from 'nostr-tools';
import { NostrRelay, NostrRelaySubscription, NostrSub, QueryJob } from '../services/interfaces';
import { RelayRequest, RelayResponse } from '../services/messages';
import { Queue } from '../services/queue';
import { Storage } from '../types/storage';

let relayWorker: RelayWorker;
let relay = undefined;
let storage = undefined;

addEventListener('message', async (ev: MessageEvent) => {
  console.log('MESSAGE RECEIVED IN RELAY WORKER!!', JSON.stringify(ev.data));

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
      if (relayWorker && relayWorker.relay && relayWorker.relay.status == 1) {
        console.log('Already connected...');
        break;
      } else {
        relayWorker = new RelayWorker(request.data.url);
        await relayWorker.connect(request.data.event);
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
    // case 'connect-and-publish':
    //   await relayWorker.publish(request.data);
    //   await relayWorker.disconnect();
    //   postMessage({ type: 'terminated', url: relayWorker.url } as RelayResponse);
    //   break;
    case 'enque':
      await relayWorker.enque(request.data);
      break;
    case 'subscribe':
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

function yieldToMain() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export class RelayWorker {
  relay!: NostrRelay;

  /** These are the subscription instances connected to the relay. */
  // subs: NostrSub[] = [];
  /** These are the subscriptions the app has requested and manages. */
  subscriptions: NostrRelaySubscription[] = [];

  queue: Queue;

  constructor(public url: string) {
    this.queue = new Queue();
  }

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

  /** Enques a job to be processed against connected relays. */
  enque(job: QueryJob) {
    // It is way more optimal to just delegate jobs into separate queues when enquing than querying later.
    if (job.type == 'Profile') {
      this.queue.queues.profile.jobs.push(job);
    } else if (job.type == 'Contacts') {
      this.queue.queues.contacts.jobs.push(job);
    } else if (job.type == 'Event') {
      this.queue.queues.event.jobs.push(job);
    } else {
      throw Error(`This type of job (${job.type}) is currently not supported.`);
    }

    console.log(`${this.url}: Job enqued...processing...`);

    this.process();

    // We always delay the processing in case we receive more.
    // setTimeout(() => {
    //   this.processQueues();
    // }, 100);
  }

  process() {
    this.processProfiles();
    this.processContacts();
    this.processSubscriptions();
  }

  processSubscriptions() {
    if (!this.relay || this.relay.status != 1) {
      return;
    }

    if (this.queue.queues.subscriptions.jobs.length == 0) {
      return;
    }

    while (this.queue.queues.subscriptions.jobs.length) {
      const job = this.queue.queues.subscriptions.jobs.shift();

      if (job) {
        this.subscribe(job.filters, job.id);
      }
    }
  }

  processProfiles() {
    if (!this.relay || this.relay.status != 1 || this.queue.queues.profile.active) {
      console.log(`${this.url}: processProfiles: Relay not ready or currently active: ${this.queue.queues.profile.active}.`, this.relay);
      return;
    }

    console.log(`${this.url}: processProfiles: Processing with downloading... Count: ` + this.queue.queues.profile.jobs.length);

    if (this.queue.queues.profile.jobs.length == 0) {
      this.queue.queues.profile.active = false;
      return;
    }

    this.queue.queues.profile.active = true;
    const job = this.queue.queues.profile.jobs.shift();

    console.log(`${this.url}: processProfiles: Job: `, job);

    this.downloadProfile(job!.identifier);
  }

  processContacts() {
    if (!this.relay || this.relay.status != 1 || this.queue.queues.contacts.active) {
      return;
    }

    if (this.queue.queues.contacts.jobs.length == 0) {
      this.queue.queues.contacts.active = false;
      return;
    }

    this.queue.queues.contacts.active = true;
    const job = this.queue.queues.contacts.jobs.shift();

    this.downloadContacts(job!.identifier, () => {
      this.queue.queues.contacts.active = false;
      this.processContacts();
    });
  }

  processEvents() {}

  /** Provide event to publish and terminate immediately. */
  async connect(event?: any) {
    // const relay = relayInit('wss://relay.nostr.info');
    const relay = relayInit(this.url) as NostrRelay;
    // relay.subscriptions = [];

    this.relay = relay;

    relay.on('connect', async () => {
      console.log(`${this.url}: Connected.`);
      postMessage({ type: 'status', data: 1, url: relay.url } as RelayResponse);

      // If there was an event provided, publish it and then disconnect.
      if (event) {
        await this.publish(event);
        await this.disconnect();
        postMessage({ type: 'terminated', url: relayWorker.url } as RelayResponse);
      } else {
        // Make sure we set the relay as well before processing.
        // this.relay = relay;

        // Upon connection, make sure we process anything that is in the queue immediately:
        this.process();
        // onConnected(relay);
        //this.onConnected(relay);
      }
    });

    relay.on('disconnect', () => {
      console.log(`${this.url}: DISCONNECTED!`);
      this.subscriptions = [];
      postMessage({ type: 'status', data: 0, url: relay.url } as RelayResponse);
    });

    relay.on('notice', (msg: any) => {
      console.log(`${this.url}: NOTICE: ${msg}`);
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
      postMessage({ relay: this.url, error: 'Unable to connect.' });
      console.log(err);
      return;
      // relay.metadata.error = 'Unable to connect.';
    }

    // this.relay = relay;
    // console.log(`${this.url}: THIS.RELAY WAS SET:`, this.relay);
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

  profileSub?: NostrSub;
  profileTimer?: any;

  contactsSub?: NostrSub;
  contactsTimer?: any;

  clearProfileSub() {
    this.profileSub?.unsub();
    this.profileSub = undefined;
  }

  clearContactsSub() {
    this.contactsSub?.unsub();
    this.contactsSub = undefined;
  }

  downloadProfile(pubkey: string, timeoutSeconds: number = 12) {
    console.log('DOWNLOAD PROFILE....');
    let finalizedCalled = false;

    if (!this.relay) {
      console.warn('This relay does not have active connection and download cannot be executed at this time.');
      return;
    }

    // If the profilesub already exists, unsub and remove.
    if (this.profileSub) {
      console.log('Profile sub already existed, unsub before continue.');
      this.clearProfileSub();
    }

    // Skip if the subscription is already added.
    // if (this.subscriptions.findIndex((s) => s.id == id) > -1) {
    //   debugger;
    //   console.log('This subscription is already added!');
    //   return;
    // }

    const sub = this.relay.sub([{ kinds: [0], authors: [pubkey] }]) as NostrSub;
    this.profileSub = sub;
    // sub.id = id;
    // console.log('SUBSCRIPTION:', sub);
    // this.subscriptions.push({ id: id, filters: filters, sub: sub });

    // const sub = relay.sub(filters, {}) as NostrSubscription;
    // relay.subscriptions.push(sub);

    sub.on('event', (originalEvent: any) => {
      console.log('POST MESSAGE BACK TO MAIN');
      postMessage({ url: this.url, type: 'event', data: originalEvent } as RelayResponse);
      console.log('FINISHED POST MESSAGE BACK TO MAIN');
      // console.log('CLEAR PROFILE SUBSCRIPTION....');

      // this.clearProfileSub();
      // clearTimeout(this.profileTimer);
      // console.log('FINISHED CLEAR PROFILE SUBSCRIPTION....');

      // this.queue.queues.profile.active = false;
      // this.processProfiles();

      // if (!finalizedCalled) {
      //   finalizedCalled = true;
      //   console.log('Calling finalized!!!');
      //   finalized();
      //   console.log('Called finalized!!!');
      // }

      // console.log('Profile event received, finalized called.');

      // const event = this.eventService.processEvent(originalEvent);
      // if (!event) {
      //   return;
      // }
      // observer.next(event);
    });

    sub.on('eose', () => {
      console.log('eose on profile, profile likely not found.');
      clearTimeout(this.profileTimer);
      this.clearProfileSub();
      this.queue.queues.profile.active = false;
      this.processProfiles();
    });

    console.log('REGISTER TIMEOUT!!', timeoutSeconds * 1000);

    this.profileTimer = setTimeout(() => {
      console.warn(`${this.url}: Profile download timeout reached.`);
      this.clearProfileSub();
      this.queue.queues.profile.active = false;
      this.processProfiles();

      postMessage({ url: this.url, type: 'timeout', data: { type: 'Profile', identifier: pubkey } } as RelayResponse);

      // if (!finalizedCalled) {
      //   finalizedCalled = true;
      //   finalized();
      // }
    }, timeoutSeconds * 1000);
  }

  downloadContacts(pubkey: string, finalized: any, timeoutSeconds: number = 3000) {
    console.log('DOWNLOAD CONTACTS....');
    let finalizedCalled = false;

    if (!this.relay) {
      console.warn('This relay does not have active connection and download cannot be executed at this time.');
      return;
    }

    // If the profilesub already exists, unsub and remove.
    if (this.contactsSub) {
      this.clearContactsSub();
    }

    const sub = this.relay.sub([{ kinds: [3], authors: [pubkey] }]) as NostrSub;
    this.contactsSub = sub;

    sub.on('event', (originalEvent: any) => {
      postMessage({ url: this.url, type: 'event', data: originalEvent } as RelayResponse);
      this.clearContactsSub();
      clearTimeout(this.contactsTimer);
      if (!finalizedCalled) {
        finalizedCalled = true;
        finalized();
      }
    });

    this.contactsTimer = setTimeout(() => {
      this.clearContactsSub();
      if (!finalizedCalled) {
        finalizedCalled = true;
        finalized();
      }
    }, timeoutSeconds * 1000);
  }

  subscribe(filters: Filter[], id: string) {
    console.log('SUBSCRIBE....');

    if (!this.relay || this.relay.status != 1) {
      // If we don't have a connection yet, schedule the subscription to be added later.
      this.queue.queues.subscriptions.jobs.push({ id: id, filters: filters });
      console.warn('This relay does not have active connection and subscription cannot be created at this time. Subscription has been scheduled for adding later.');
      return;
    }

    // Skip if the subscription is already added.
    if (this.subscriptions.findIndex((s) => s.id == id) > -1) {
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
