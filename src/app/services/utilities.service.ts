import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as secp from '@noble/secp256k1';
import { bech32 } from '@scure/base';
import { Subscription } from 'rxjs';
import { copyToClipboard } from '../shared/utilities';
import { DataValidation } from './data-validation.service';
import { NostrProfileDocument, NostrProfile, NostrEvent, NostrEventDocument } from './interfaces';

export function sleep(durationInMillisecond: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationInMillisecond));
}

@Injectable({
  providedIn: 'root',
})
export class Utilities {
  constructor(private snackBar: MatSnackBar, private validator: DataValidation) {}

  unsubscribe(subscriptions: Subscription[]) {
    if (!subscriptions) {
      return;
    }

    for (let i = 0; i < subscriptions.length; i++) {
      subscriptions[i].unsubscribe();
    }
  }

  reduceProfile(profile: NostrProfileDocument): NostrProfile {
    return {
      name: profile.name,
      about: profile.about,
      picture: profile.picture,
      nip05: profile.nip05,
      lud06: profile.lud06,
      // TODO: Consider adding support for these in the future depending on how the community of Nostr grows and adopts these fields.
      // display_name: profile.display_name,
      // website: profile.website
    } as NostrProfile;
  }

  mapProfileEvent(event: NostrEventDocument): NostrProfileDocument {
    const jsonParsed = JSON.parse(event.content) as NostrProfileDocument;
    const profile = this.validator.sanitizeProfile(jsonParsed) as NostrProfileDocument;
    profile.pubkey = event.pubkey;
    return profile;
  }

  getNostrIdentifier(pubkey: string) {
    const key = this.hexToArray(pubkey);
    const converted = this.convertToBech32(key, 'npub');
    return converted;
  }

  ensureHexIdentifier(pubkey: string) {
    if (pubkey.startsWith('npub')) {
      pubkey = this.arrayToHex(this.convertFromBech32(pubkey));
    }

    return pubkey;
  }

  copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  getHexIdentifier(pubkey: string) {
    const key = this.hexToArray(pubkey);
    const converted = this.convertToBech32(key, 'npub');
    return converted;
  }

  getShortenedIdentifier(pubkey: string) {
    const fullId = this.getNostrIdentifier(pubkey);
    return `${fullId.substring(4, 12)}:${fullId.substring(fullId.length - 8)}`;
  }

  private convertToBech32(key: Uint8Array, prefix: string) {
    const words = bech32.toWords(key);
    const value = bech32.encode(prefix, words);

    return value;
  }

  private hexToArray(value: string) {
    return secp.utils.hexToBytes(value);
  }

  arrayToHex(value: Uint8Array) {
    return secp.utils.bytesToHex(value);
  }

  convertFromBech32(address: string) {
    const decoded = bech32.decode(address);
    const key = bech32.fromWords(decoded.words);

    return key;
  }

  keyToHex(publicKey: Uint8Array) {
    return secp.utils.bytesToHex(publicKey);
  }
}
