import { Injectable } from '@angular/core';
import * as secp from '@noble/secp256k1';
import { bech32 } from '@scure/base';

export function sleep(durationInMillisecond: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationInMillisecond));
}

@Injectable({
  providedIn: 'root',
})
export class Utilities {
  getNostrIdentifier(pubkey: string) {
    const key = this.hexToArray(pubkey);
    const converted = this.convertToBech32(key, 'npub');
    return converted;
  }

  getHexIdentifier(pubkey: string) {
    const key = this.hexToArray(pubkey);
    const converted = this.convertToBech32(key, 'npub');
    return converted;
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
