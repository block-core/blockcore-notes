// import { Relay, relayInit, Sub } from 'nostr-tools';
// import { NostrRelay } from '../services/interfaces';

// export class RelayWorker {
//   subs: Sub[] = [];

//   relays: NostrRelay[] = [];

//   constructor() {}

//   async connect(url: string) {
//     // const relay = relayInit('wss://relay.nostr.info');
//     const relay = relayInit(url) as NostrRelay;
//     relay.subscriptions = [];

//     relay.on('connect', () => {
//       console.log(`connected to ${relay?.url}`);
//       //   onConnected(relay);
//       //this.onConnected(relay);
//     });

//     relay.on('disconnect', () => {
//       console.log(`DISCONNECTED! ${relay?.url}`);
//       relay.subscriptions = [];
//     });

//     relay.on('notice', (msg: any) => {
//       console.log(`NOTICE FROM ${relay?.url}: ${msg}`);
//     });

//     // Keep a reference of the metadata on the relay instance.
//     // relay.metadata = server;

//     if (relay.metadata.enabled == undefined) {
//       relay.metadata.enabled = true;
//     }

//     try {
//       if (relay.metadata.enabled) {
//         await relay.connect();
//       }
//     } catch (err) {
//       console.log(err);
//       relay.metadata.error = 'Unable to connect.';
//     }

//     // await this.addRelay(relay);

//     return relay;
//   }
// }
