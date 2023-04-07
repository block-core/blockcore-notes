import { Event, Filter, Kind, relayInit } from 'nostr-tools';
import { NostrRelay, NostrRelaySubscription, NostrSub, QueryJob } from '../services/interfaces';
import { RelayResponse } from '../services/messages';
import { Queue } from '../services/queue';

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
    if (event.kind == Kind.Article || (event.kind as number) == 30008 || (event.kind as number) == 30009) {
      // If we don't have metadata from the relay, don't publish articles.
      if (!this.relay.nip11) {
        console.log(`${this.relay.url}: This relay does not return NIP-11 metadata. Article/Badge will not be published here.`);
        return;
      } else if (!this.relay.nip11.supported_nips.includes(33)) {
        console.log(`${this.relay.url}: This relay does not NIP-23. Article/Badge will not be published here.`);
        return;
      } else {
        console.log(`${this.relay.url}: This relay supports NIP-23. Publishing article/badge on this relay.`);
      }
    }

    let pub = this.relay.publish(event);
    pub.on('ok', () => {
      console.log(`${this.relay.url} has accepted our event`);
    });
    // pub.on('seen', () => {
    //   console.log(`we saw the event on ${this.relay.url}`);
    // });
    pub.on('failed', (reason: any) => {
      console.log(`failed to publish to ${this.relay.url}: ${reason}`);
      postMessage({ type: 'failure', data: reason, url: this.relay.url } as RelayResponse);
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
    } else if (job.type == 'Article') {
      this.queue.queues.article.jobs.push(job);
    } else if (job.type == 'BadgeDefinition') {
      this.queue.queues.badgedefinition.jobs.push(job);
    } else {
      throw Error(`This type of job (${job.type}) is currently not supported.`);
    }

    console.log(`${this.url}: Job enqued...processing...`);

    // We always delay the processing in case we receive more.
    setTimeout(() => {
      this.process();
    }, 500);
  }

  process() {
    this.processArticle();
    this.processBadgeDefinition();
    this.processProfiles();
    this.processContacts();
    this.processEvents();
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

    // console.log(`${this.url}: processProfiles: Processing with downloading... Count: ` + this.queue.queues.profile.jobs.length);

    if (this.queue.queues.profile.jobs.length == 0) {
      this.queue.queues.profile.active = false;
      return;
    }

    this.queue.queues.profile.active = true;

    const profilesToDownload = this.queue.queues.profile.jobs
      .splice(0, 500)
      .map((j) => j.identifier)
      .filter((v, i, a) => a.indexOf(v) === i); // Unique, it can happen that multiple of same is added.

    // console.log('profilesToDownload:', profilesToDownload);

    this.downloadProfile(profilesToDownload, profilesToDownload.length * 3);
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

  processEvents() {
    if (!this.relay || this.relay.status != 1 || this.queue.queues.event.active) {
      console.log(`${this.url}: processEvents: Relay not ready or currently active: ${this.queue.queues.event.active}.`, this.relay);
      return;
    }

    console.log(`${this.url}: processEvents: Processing with downloading... Count: ` + this.queue.queues.event.jobs.length);

    if (this.queue.queues.event.jobs.length == 0) {
      this.queue.queues.event.active = false;
      return;
    }

    this.queue.queues.event.active = true;

    console.log(this.relay);

    const eventsToDownload = this.queue.queues.event.jobs
      .splice(0, 500)
      .map((j) => j.identifier)
      .filter((v, i, a) => a.indexOf(v) === i); // Unique, it can happen that multiple of same is added.

    console.log('eventsToDownload:', eventsToDownload);
    this.downloadEvent(eventsToDownload, eventsToDownload.length * 3);
  }

  processArticle() {
    if (!this.relay || this.relay.status != 1 || this.queue.queues.article.active) {
      console.log(`${this.url}: processArticle: Relay not ready or currently active: ${this.queue.queues.article.active}.`, this.relay);
      return;
    }

    console.log(`${this.url}: processArticle: Processing with downloading... Count: ` + this.queue.queues.article.jobs.length);

    if (this.queue.queues.article.jobs.length == 0) {
      this.queue.queues.article.active = false;
      return;
    }

    this.queue.queues.article.active = true;

    console.log(this.relay);

    const eventsToDownload = this.queue.queues.article.jobs
      .splice(0, 500)
      .map((j) => j.identifier)
      .filter((v, i, a) => a.indexOf(v) === i); // Unique, it can happen that multiple of same is added.

    console.log('articleToDownload:', eventsToDownload);
    this.downloadArticle(eventsToDownload, eventsToDownload.length * 3);
  }

  processBadgeDefinition() {
    if (!this.relay || this.relay.status != 1 || this.queue.queues.badgedefinition.active) {
      console.log(`${this.url}: processBadgeDefinition: Relay not ready or currently active: ${this.queue.queues.badgedefinition.active}.`, this.relay);
      return;
    }

    console.log(`${this.url}: processBadgeDefinition: Processing with downloading... Count: ` + this.queue.queues.badgedefinition.jobs.length);

    if (this.queue.queues.badgedefinition.jobs.length == 0) {
      this.queue.queues.badgedefinition.active = false;
      return;
    }

    this.queue.queues.badgedefinition.active = true;

    console.log(this.relay);

    const eventsToDownload = this.queue.queues.badgedefinition.jobs
      .splice(0, 500)
      .map((j) => j.identifier)
      .filter((v, i, a) => a.indexOf(v) === i); // Unique, it can happen that multiple of same is added.

    console.log('badgeDefinitionsToDownload:', eventsToDownload);
    this.downloadBadgeDefinition(eventsToDownload, eventsToDownload.length * 3);
  }

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
        this.disconnect();
        postMessage({ type: 'terminated', url: this.url } as RelayResponse);
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

    try {
      await relay.connect();
    } catch (err) {
      postMessage({ type: 'error', relay: this.url, error: 'Unable to connect.' });
      console.error('Unable to connect.');
    }
  }

  disconnect() {
    if (this.relay.status == 1) {
      console.log(`${this.url}: relay.status: ${this.relay.status}, calling close!`);
      this.relay.close();
    }
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

  eventSub?: NostrSub;
  eventTimer?: any;

  articleSub?: NostrSub;
  articleTimer?: any;

  badgeDefinitionSub?: NostrSub;
  badgeDefinitionTimer?: any;

  clearProfileSub() {
    this.profileSub?.unsub();
    this.profileSub = undefined;
  }

  clearContactsSub() {
    this.contactsSub?.unsub();
    this.contactsSub = undefined;
  }

  clearEventSub() {
    this.eventSub?.unsub();
    this.eventSub = undefined;
  }

  clearArticleSub() {
    this.articleSub?.unsub();
    this.articleTimer = undefined;
  }

  clearBadgeDefinitionSub() {
    this.badgeDefinitionSub?.unsub();
    this.badgeDefinitionTimer = undefined;
  }

  downloadProfile(pubkeys: string[], timeoutSeconds: number = 12) {
    console.log('DOWNLOAD PROFILE....');
    let finalizedCalled = false;

    if (!this.relay) {
      debugger;
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

    const sub = this.relay.sub([{ kinds: [0], authors: pubkeys }]) as NostrSub;
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

      postMessage({ url: this.url, type: 'timeout', data: { type: 'Profile', identifier: pubkeys } } as RelayResponse);

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

  downloadArticle(ids: string[], timeoutSeconds: number = 12) {
    console.log('DOWNLOAD ARTICLE....');
    let finalizedCalled = false;

    if (!this.relay) {
      debugger;
      console.warn('This relay does not have active connection and download cannot be executed at this time.');
      return;
    }

    // If the profilesub already exists, unsub and remove.
    if (this.articleSub) {
      console.log('Article sub already existed, unsub before continue.');
      this.clearArticleSub();
    }

    // Skip if the subscription is already added.
    // if (this.subscriptions.findIndex((s) => s.id == id) > -1) {
    //   debugger;
    //   console.log('This subscription is already added!');
    //   return;
    // }

    const filter = { kinds: [Kind.Article], authors: ids };
    const sub = this.relay.sub([filter]) as NostrSub;
    this.articleSub = sub;

    sub.on('event', (originalEvent: any) => {
      console.log('POST MESSAGE BACK TO MAIN');
      postMessage({ url: this.url, type: 'event', data: originalEvent } as RelayResponse);
      console.log('FINISHED POST MESSAGE BACK TO MAIN');
    });

    sub.on('eose', () => {
      console.log('eose on event.');
      clearTimeout(this.articleTimer);
      this.clearArticleSub();
      this.queue.queues.article.active = false;
      this.processArticle();
    });

    console.log('REGISTER TIMEOUT!!', timeoutSeconds * 1000);

    this.articleTimer = setTimeout(() => {
      console.warn(`${this.url}: Event download timeout reached.`);
      this.clearArticleSub();
      this.queue.queues.article.active = false;
      this.processArticle();

      postMessage({ url: this.url, type: 'timeout', data: { type: 'Event', identifier: ids } } as RelayResponse);

      // if (!finalizedCalled) {
      //   finalizedCalled = true;
      //   finalized();
      // }
    }, timeoutSeconds * 1000);
  }

  downloadBadgeDefinition(ids: string[], timeoutSeconds: number = 12) {
    console.log('DOWNLOAD BADGE DEFINITION....');

    if (!this.relay) {
      debugger;
      console.warn('This relay does not have active connection and download cannot be executed at this time.');
      return;
    }

    // If the profilesub already exists, unsub and remove.
    if (this.badgeDefinitionSub) {
      console.log('Article sub already existed, unsub before continue.');
      this.clearBadgeDefinitionSub();
    }

    // Skip if the subscription is already added.
    // if (this.subscriptions.findIndex((s) => s.id == id) > -1) {
    //   debugger;
    //   console.log('This subscription is already added!');
    //   return;
    // }

    const filters: Filter[] = [];

    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      const lines = id.split(':');
      const pubkey = lines[1];

      // In case there is a ':' value within the slug, we get the slug like this:
      const slug = id.replace('30009:', '').replace(pubkey + ':', '');
      filters.push({ kinds: [30009], authors: [pubkey], ['#d']: [slug] });
    }

    const sub = this.relay.sub(filters) as NostrSub;
    this.badgeDefinitionSub = sub;

    sub.on('event', (originalEvent: any) => {
      console.log('POST MESSAGE BACK TO MAIN');
      postMessage({ url: this.url, type: 'event', data: originalEvent } as RelayResponse);
      console.log('FINISHED POST MESSAGE BACK TO MAIN');
    });

    sub.on('eose', () => {
      console.log('eose on event.');
      clearTimeout(this.badgeDefinitionTimer);
      this.clearBadgeDefinitionSub();
      this.queue.queues.badgedefinition.active = false;
      this.processBadgeDefinition();
    });

    console.log('REGISTER TIMEOUT!!', timeoutSeconds * 1000);

    this.badgeDefinitionTimer = setTimeout(() => {
      console.warn(`${this.url}: Event download timeout reached.`);
      this.clearBadgeDefinitionSub();
      this.queue.queues.badgedefinition.active = false;
      this.processBadgeDefinition();

      postMessage({ url: this.url, type: 'timeout', data: { type: 'Event', identifier: ids } } as RelayResponse);

      // if (!finalizedCalled) {
      //   finalizedCalled = true;
      //   finalized();
      // }
    }, timeoutSeconds * 1000);
  }

  download(filters: Filter[], id: string, type: string = 'Event', timeoutSeconds: number = 12) {
    if (!this.relay) {
      console.warn('This relay does not have active connection and download cannot be executed at this time.');
      return;
    }

    let sub: NostrSub | undefined = this.relay.sub(filters) as NostrSub;

    sub.on('event', (originalEvent: any) => {
      postMessage({ url: this.url, type: 'event', data: originalEvent, subscription: id } as RelayResponse);
    });

    sub.on('eose', () => {
      clearTimeout(timer);

      if (sub) {
        sub.unsub();
        sub = undefined;
      }
    });

    const timer = setTimeout(() => {
      if (sub) {
        sub.unsub();
        sub = undefined;
      }

      postMessage({ url: this.url, type: 'timeout', data: { type, filters } } as RelayResponse);
    }, timeoutSeconds * 1000);
  }

  downloadEvent(ids: string[], timeoutSeconds: number = 12) {
    console.log('DOWNLOAD EVENT....');
    let finalizedCalled = false;

    if (!this.relay) {
      debugger;
      console.warn('This relay does not have active connection and download cannot be executed at this time.');
      return;
    }

    // If the profilesub already exists, unsub and remove.
    if (this.eventSub) {
      console.log('Event sub already existed, unsub before continue.');
      this.clearEventSub();
    }

    // Skip if the subscription is already added.
    // if (this.subscriptions.findIndex((s) => s.id == id) > -1) {
    //   debugger;
    //   console.log('This subscription is already added!');
    //   return;
    // }

    const kinds = [Kind.Text];

    const sub = this.relay.sub([{ kinds: kinds, ids: ids }]) as NostrSub;
    this.eventSub = sub;

    sub.on('event', (originalEvent: any) => {
      console.log('POST MESSAGE BACK TO MAIN');
      postMessage({ url: this.url, type: 'event', data: originalEvent } as RelayResponse);
      console.log('FINISHED POST MESSAGE BACK TO MAIN');
    });

    sub.on('eose', () => {
      console.log('eose on event.');
      clearTimeout(this.eventTimer);
      this.clearEventSub();
      this.queue.queues.event.active = false;
      this.processEvents();
    });

    console.log('REGISTER TIMEOUT!!', timeoutSeconds * 1000);

    this.eventTimer = setTimeout(() => {
      console.warn(`${this.url}: Event download timeout reached.`);
      this.clearEventSub();
      this.queue.queues.event.active = false;
      this.processEvents();

      postMessage({ url: this.url, type: 'timeout', data: { type: 'Event', identifier: ids } } as RelayResponse);

      // if (!finalizedCalled) {
      //   finalizedCalled = true;
      //   finalized();
      // }
    }, timeoutSeconds * 1000);
  }

  subscribe(filters: Filter[], id: string) {
    if (!this.relay || this.relay.status != 1) {
      // If we don't have a connection yet, schedule the subscription to be added later.
      this.queue.queues.subscriptions.jobs.push({ id: id, filters: filters, type: 'Event', events: [] });
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
    this.subscriptions.push({ id: id, filters: filters, sub: sub, type: 'Event', events: [] });

    // const sub = relay.sub(filters, {}) as NostrSubscription;
    // relay.subscriptions.push(sub);

    sub.on('event', (originalEvent: any) => {
      postMessage({ url: this.url, subscription: id, type: 'event', data: originalEvent } as RelayResponse);
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
      let protocol = url.protocol === 'ws:' ? 'http' : 'https';

      const infoUrl = `${protocol}://${url.host}`;
      const rawResponse = await fetch(infoUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'application/nostr+json',
        },
      });
      if (rawResponse.status === 200) {
        const content = await rawResponse.json();
        // Keep a local reference to the NIP11 info on the relay instance.
        this.relay.nip11 = content;
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
