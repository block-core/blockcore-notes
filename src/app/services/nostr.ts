import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class NostrService {
  /** Default relays that the app has for users without extension. This follows the document structure as extension data. */
  defaultRelays: any = {
    // 'wss://nostr-pub.wellorder.net': { read: true, write: true },
    // 'wss://relay.nostr.ch': { read: true, write: true },
    // 'wss://relay.damus.io': { read: true, write: true },
    'wss://relay.plebstr.com': { read: true, write: true },
    'wss://relay.nostr.info': { read: true, write: true },
    'wss://e.nos.lol': { read: true, write: true },
    'wss://nostr.mom': { read: true, write: true },
    'wss://relay.snort.social': { read: true, write: true },
    'wss://relay.nostr.bg': { read: true, write: true },
    'wss://nostr.fmt.wiz.biz': { read: true, write: true },
  };

  async sign(event: any) {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkey) {
      const gt = globalThis as any;

      // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
      return gt.nostr.signEvent(event);
    } else {
      throw Error('Private key based signing not implemented yet.');
    }
  }

  async relays() {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkey) {
      try {
        const gt = globalThis as any;
        const relays = gt.nostr.getRelays();
        return relays;
      } catch (err) {
        return this.defaultRelays;
      }
    } else {
      return this.defaultRelays;
    }
  }

  async decrypt(pubkey: string, content: string) {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkey) {
      const gt = globalThis as any;
      const decrypted = await gt.nostr.nip04.decrypt(pubkey, content);
      return decrypted;
    } else {
      throw Error('Private key based decrypt not implemented yet.');
    }
  }

  async encrypt(pubkey: string, content: string) {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:prvkey');

    if (!prvkey) {
      const gt = globalThis as any;
      const decrypted = await gt.nostr.nip04.encrypt(pubkey, content);
      return decrypted;
    } else {
      throw Error('Private key based encrypt not implemented yet.');
    }
  }
}
