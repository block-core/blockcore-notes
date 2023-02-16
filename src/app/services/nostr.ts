import { Injectable } from '@angular/core';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from './interfaces';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class NostrService {
  async sign(event: any) {
    let prvkey = localStorage.getItem('blockcore:notes:nostr:pubkey');

    if (!prvkey) {
      const gt = globalThis as any;

      // Use nostr directly on global, similar to how most Nostr app will interact with the provider.
      return gt.nostr.signEvent(event);
    } else {
      throw Error('Private key based signing not implemented yet.');
    }
  }
}
