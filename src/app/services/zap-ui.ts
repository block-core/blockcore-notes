import { Injectable } from '@angular/core';
import { NostrEventDocument, Zapper, ParsedZap, NostrEvent } from './interfaces';
import { decode } from 'light-bolt11-decoder';
import { sha256 } from '@noble/hashes/sha256';
import { Utilities } from './utilities';
import { ZapService } from './zap.service';
import { EventService } from './event';

interface ZapStatus {
  ids: string[];
  amount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ZapUiService {
  events = new Map<string, ZapStatus>();
  profiles = new Map<string, ZapStatus>();

  constructor(private zapService: ZapService, private eventService: EventService) {}

  reset() {
    this.events.clear();
    this.profiles.clear();
  }

  getEventZapAmount(eventId: string) {
    const zapStatus = this.events.get(eventId);

    if (!zapStatus) {
      return null;
    }

    return zapStatus.amount;
  }

  getProfileZapAmount(pubkey: string) {
    const zapStatus = this.profiles.get(pubkey);

    if (!zapStatus) {
      return null;
    }

    return zapStatus.amount;
  }

  addZap(event: NostrEvent) {
    const parsedZap = this.zapService.parseZap(event);

    if (parsedZap.e) {
      let eventMap = this.events.get(parsedZap.e);

      if (!eventMap) {
        eventMap = {
          ids: [parsedZap.id],
          amount: parsedZap.amount,
        };
      } else {
        if (eventMap.ids.includes(parsedZap.id)) {
          return;
        }

        eventMap.ids.push(parsedZap.id);
        eventMap.amount += parsedZap.amount;
      }

      this.events.set(parsedZap.e, eventMap);
    }

    let profileMap = this.profiles.get(parsedZap.p);

    if (!profileMap) {
      profileMap = {
        ids: [parsedZap.id],
        amount: parsedZap.amount,
      };
    } else {
      if (profileMap.ids.includes(parsedZap.id)) {
        return;
      }

      profileMap.ids.push(parsedZap.id);
      profileMap.amount += parsedZap.amount;
    }

    this.profiles.set(parsedZap.p, profileMap);
  }
}
