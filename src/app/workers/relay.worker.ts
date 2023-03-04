/// <reference lib="webworker" />

import { RelayRequest, RelayResponse } from '../services/messages';
import { RelayWorker } from './relay';

let relayWorker: RelayWorker;

addEventListener('message', async (ev: MessageEvent) => {
  // console.log(`${relayWorker?.url}: MESSAGE RECEIVED IN RELAY WORKER!!`, JSON.stringify(ev.data));

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
        break;
      }
    case 'disconnect':
      relayWorker.disconnect();
      break;
    case 'publish':
      await relayWorker.publish(request.data);
      break;
    case 'enque':
      await relayWorker.enque(request.data);
      break;
    case 'subscribe':
      await relayWorker.subscribe(request.data.filters, request.data.id);
      break;
    case 'download':
      await relayWorker.download(request.data.filters, request.data.id, request.data.type);
      break;
    case 'unsubscribe':
      await relayWorker.unsubscribe(request.data);
      break;
    case 'terminate':
      try {
        relayWorker.disconnect();
      } catch (err) {
        console.error('Error during disconnect.', err);
      }
      console.log(`${relayWorker.url}: Sending 'terminated' event.`);
      postMessage({ type: 'terminated', url: relayWorker.url } as RelayResponse);
      break;
  }
});

function yieldToMain() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
