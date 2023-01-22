import { Filter } from 'nostr-tools';
import { RelayRequest, RelayResponse } from '../services/messages';
import { v4 as uuidv4 } from 'uuid';

/** Relay type that holds a connection to the Web Worker and abstracts calling different actions to the Web Worker. */
export class RelayType {
  constructor(public url: string) {}

  status = 'ok';

  start() {
    this.worker = new Worker(new URL('../workers/relay.worker', import.meta.url));
    return this.worker;
  }

  connect() {
    this.action('connect', this.url);
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

  publish(data: any) {
    this.action('publish', data);
  }

  download(query: any) {
    this.action('download', query);
  }

  subscribe(filters: Filter[]) {
    const id = uuidv4();
    this.action('subscribe', { filters, id });
    return id;
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
