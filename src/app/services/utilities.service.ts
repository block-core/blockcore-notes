import { Injectable } from '@angular/core';
import * as secp from '@noble/secp256k1';
import { bech32 } from '@scure/base';

@Injectable({
  providedIn: 'root',
})
export class Utilities {
  getNostrIdentifier(address: string) {
    const key = this.hexToArray(address);
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

  keyToHex(publicKey: Uint8Array) {
    return secp.utils.bytesToHex(publicKey);
  }
}
