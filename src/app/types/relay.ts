import { Filter } from 'nostr-tools';
import { NostrRelaySubscription, QueryJob } from '../services/interfaces';
import { RelayRequest, RelayResponse } from '../services/messages';

/** Relay type that holds a connection to the Web Worker and abstracts calling different actions to the Web Worker. */
export class RelayType {
  constructor(public url: string) {}

  status = 'ok';

  start() {
    console.log(`${this.url}: start method new Worker called.`);
    this.worker = new Worker(new URL('../workers/relay.worker', import.meta.url));
    return this.worker;
  }

  // connectAndPublish(event: any) {
  //   this.action('connect', { url: this.url, event: event });
  // }

  connect(subscriptions?: NostrRelaySubscription[], event?: any) {
    this.action('connect', { url: this.url, subscriptions, event: event });
  }

  disconnect() {
    this.action('disconnect');
  }

  /** Terminate will terminate the Web Worker and shutdown Web Socket connection. */
  terminate() {
    // this.disconnect();
    // postMessage({ type: 'status', data: 1, url: relay.url } as RelayResponse);
    // this.worker?.onmessage?.call(this.worker, { type: 'status', data: 1, url: this.url } as RelayResponse);
    // this.worker?.postMessage({ type: 'status', data: -1 } as RelayRequest);
    this.action('terminate');
  }

  enque(data: QueryJob) {
    this.action('enque', data);
  }

  publish(data: any) {
    this.action('publish', data);
  }

  download(query: any) {
    this.action('download', query);
  }

  subscribe(filters: Filter[], id: string) {
    this.action('subscribe', { filters, id });
  }

  unsubscribe(id: string) {
    this.action('unsubscribe', id);
  }

  action(type: string, data?: any) {
    if (this.status != 'ok') {
      throw new Error('The status of this relay worker is: ' + this.status);
    }

    this.worker?.postMessage({ type, data } as RelayRequest);
  }

  worker?: Worker;
}
