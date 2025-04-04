import { inject, Injectable, signal } from "@angular/core";
import { StorageService } from "./storage";
import { LoggerService } from "./logger";
import { NostrService } from "./nostr";
import { NostrRelay, NostrRelayDocument, RelayEntry } from "./interfaces";
import { SimplePool } from 'nostr-tools/pool';
import { kinds, nip11 } from 'nostr-tools';
import { ApplicationState } from "./applicationstate";

@Injectable({
    providedIn: 'root',
})
export class Relay2Service {
    storage = inject(StorageService);
    logger = inject(LoggerService);
    nostr = inject(NostrService);
    appState = inject(ApplicationState);
    db = inject(StorageService);
    connected = signal(false);
    // relays = signal([]);
    #pool: SimplePool = new SimplePool();

    relays = signal<RelayEntry[]>([]);

    get relaysInfo() {
        debugger;
        const p = this.#pool as any;
        return p.relays.values();
    }

    // async initialize() {
    //     this.items = await this.db.storage.getRelays();

    //     // If there are no relay metatadata in database, get it from extension or default
    //     if (this.items.length == 0) {
    //       let relays = await this.nostr.relays();

    //       // First append whatever the extension give us of relays.
    //       await this.appendRelays(relays);
    //     }

    //     this.createRelayWorkers();
    //   }

    async addRelay(url: string) {
        const metadata = await nip11.fetchRelayInformation(url);
        this.logger.info('Relay metadata:', metadata);

        const relay = await this.#pool.ensureRelay(url);

        // const metadata: RelayInformation = {
        //     nip11: relayMetadata
        // }

        let data = await this.storage.storage.getRelay(url);

        this.relays.set([...this.relays(), { url, metadata, relay, data }]);
    }

    async deleteRelay(url: string) {
        // Close the relay connection in the pool.
        this.#pool.close([url]);

        // Remove the relay from the database.
        await this.db.storage.deleteRelay(url);

        // Remove the relay from list.
        this.relays.update((r) => r.filter((item) => item.url != url));
    }

    getRelay(url: string) {
        const relay = this.relays().find((r) => r.url == url);
        return relay;
    }

    async setRelayType(url: string, type: number) {
        const relay = await this.db.storage.getRelay(url);
        const realyEntry = this.getRelay(url);

        if (!realyEntry) {
            return;
        }

        const item = realyEntry.data;

        if (relay) {
            relay.type = type;
            item!.type = type;
            await this.db.storage.putRelay(relay);
        }
    }

    async setRelayEnabled(url: string, enabled: boolean) {
        this.logger.debug('setRelayEnabled:', enabled);
        const relay = await this.db.storage.getRelay(url);
        const realyEntry = this.getRelay(url);

        if (!realyEntry) {
            return;
        }

        const item = realyEntry.data;

        if (enabled) {
            
        } else {

        }
    
        if (relay) {
          relay.enabled = enabled;
          item!.enabled = enabled;
          await this.db.storage.putRelay(relay);
        }
      }

    async initialize() {
        let relays: any = await this.storage.storage.getRelays();
        this.logger.info('Relays:', relays);

        if (relays.length == 0) {
            relays = await this.nostr.relays();
        }

        // this.relays.set(relays);

        for (let i = 0; i < relays.length; i++) {
            const relay = relays[i] as NostrRelayDocument;
            this.logger.info('Relay:', relay);
            await this.addRelay(relay.url);
        }

        this.connectToRelays();

        this.connected.set(true);
    }

    async connectToRelays() {
        // const currentUser = this.appState.getPublicKey();
        // const relaysArray = this.relays().map((relay: NostrRelayDocument) => { return relay.url });

        // // Get the current user metadata.
        // const sub = this.pool.subscribeManyEose(
        //     relaysArray,
        //     [{
        //         kinds: [kinds.Metadata],
        //         authors: [currentUser],
        //     },],
        //     {
        //         onevent(event) {
        //             console.log('got event:', event);
        //         }
        //     }
        // );

        // this.logger.info(this.pool);
        // const connections = this.pool.listConnectionStatus();
        // this.logger.info('Connections:', connections);

        // for (let i = 0; i < this.relays().length; i++) {
        //     const relay = this.relays()[i] as NostrRelayDocument;

        //     if (!relay.enabled) {
        //         continue;
        //     }

        //     this.logger.info('Connecting to relay:', relay.url);
        //     await relay.connect();

        //     relay.connected = true;
        // }
    }
}