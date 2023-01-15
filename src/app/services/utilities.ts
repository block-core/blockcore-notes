import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import * as secp from '@noble/secp256k1';
import { bech32 } from '@scure/base';
import { Subscription } from 'rxjs';
import { copyToClipboard } from '../shared/utilities';
import { DataValidation } from './data-validation';
import { NostrProfileDocument, NostrProfile, NostrEvent, NostrEventDocument } from './interfaces';

export function sleep(durationInMillisecond: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationInMillisecond));
}

@Injectable({
  providedIn: 'root',
})
export class Utilities {
  constructor(private snackBar: MatSnackBar, private validator: DataValidation, private sanitizer: DomSanitizer) {}

  unsubscribe(subscriptions: Subscription[]) {
    if (!subscriptions) {
      return;
    }

    for (let i = 0; i < subscriptions.length; i++) {
      subscriptions[i].unsubscribe();
    }
  }

  now() {
    return Math.floor(Date.now() / 1000);
  }

  reduceProfile(profile: NostrProfileDocument): NostrProfile {
    return {
      name: profile.name,
      about: profile.about,
      picture: profile.picture,
      nip05: profile.nip05,
      lud06: profile.lud06,
      display_name: profile.display_name,
      website: profile.website,
      banner: profile.banner,
      // TODO: Consider adding support for these in the future depending on how the community of Nostr grows and adopts these fields.
    } as NostrProfile;
  }

  defaultBackground = 'url(/assets/gradient.jpg)';

  getBannerBackgroundStyle(banner?: string) {
    if (!banner) {
      return this.defaultBackground;
    }

    const url = this.sanitizeImageUrl(banner);

    if (!url) {
      return this.defaultBackground;
    }

    return `url(${url})`;
  }

  getProfileDisplayName(profile: NostrProfileDocument) {
    if (profile.display_name) {
      return profile.display_name;
    } else if (profile.name) {
      return profile.name;
    } else {
      return profile.npub;
    }
  }

  getProfileTitle(profile: NostrProfileDocument) {
    if (profile.name) {
      return `@${profile.name}`;
    } else {
      return `@${profile.npub}`;
    }
  }

  mapProfileEvent(event: NostrEventDocument): NostrProfileDocument | undefined {
    // If a timeout is received, the event content will be: "The query timed out before it could complete: [{"kinds":[0],"authors":["edcd205..."]}]."
    if (typeof event === 'string') {
      return undefined;
    }

    try {
      const jsonParsed = JSON.parse(event.content) as NostrProfileDocument;
      const profile = this.validator.sanitizeProfile(jsonParsed) as NostrProfileDocument;
      profile.pubkey = event.pubkey;
      profile.created_at = event.created_at;
      return profile;
    } catch (err) {
      debugger;
      console.warn(err);
    }

    return undefined;
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

  sanitizeLUD06(url?: string) {
    // Do not allow http prefix.
    if (!url && url?.startsWith('http')) {
      return undefined;
    }

    return url;
  }

  sanitizeUrlAndBypass(url?: string) {
    const cleanedUrl = this.sanitizeUrl(url);
    return this.bypassUrl(cleanedUrl);
  }

  sanitizeUrl(url?: string) {
    if (!url && !url?.startsWith('http')) {
      return '';
    }

    return url;
  }

  sanitizeImageUrl(url?: string) {
    url = this.sanitizeUrl(url);

    if (!url) {
      return undefined;
    }

    const urlLower = url.toLowerCase();

    if (urlLower.endsWith('jpg') || urlLower.endsWith('jpeg') || urlLower.endsWith('png') || urlLower.endsWith('webp') || urlLower.endsWith('gif')) {
      return url;
    }

    return undefined;
  }

  bypassUrl(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustUrl(url);
    return clean;
  }

  bypassStyle(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustStyle(url);
    return clean;
  }

  bypassFrameUrl(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    return clean;
  }
}
