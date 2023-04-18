import { Injectable } from '@angular/core';
import { Kind } from 'nostr-tools';
import { Circle, NostrEvent, NostrProfileDocument } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  constructor(private state: State) {}

  addEvent(event: NostrEvent) {
    // TODO: Temporarily removed to avoid building massive in-memory state.
    // switch (event.kind) {
    //   case Kind.Metadata:
    //     this.addIfNewer(event, this.state.events.shortTextNote);
    //     break;
    //   case Kind.Text:
    //     this.addIfMissing(event, this.state.events.shortTextNote);
    //     break;
    // }
  }

  addIfMissing(event: NostrEvent, map: Map<string, NostrEvent>) {
    if (map.has(event.id)) {
      return;
    }

    map.set(event.id, event);
  }

  addIfNewer(event: NostrEvent, map: Map<string, NostrEvent>) {
    if (!map.has(event.id)) {
      map.set(event.id, event);
    } else {
      const existing = map.get(event.id);

      if (existing!.created_at > event.created_at) {
        return;
      }

      map.set(event.id, event);
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class State {
  profiles: NostrProfileDocument[] = [];

  circles: Circle[] = [];

  events: EventsState = {
    metadata: new Map(),
    shortTextNote: new Map(),
    recommendRelay: new Map(),
    contacts: new Map(),
    encryptedDirectMessages: new Map(),
    eventDeletion: new Map(),
    reposts: new Map(),
    reaction: new Map(),
    badgeAward: new Map(),
    channelCreation: new Map(),
    channelMetadata: new Map(),
    channelMessage: new Map(),
    channelHideMessage: new Map(),
    channelMuteUser: new Map(),
    reporting: new Map(),
    zapRequest: new Map(),
    zap: new Map(),
    muteList: new Map(),
    relayListMetadata: new Map(),
    clientAuthentication: new Map(),
    nostrConnect: new Map(),
    categorizedPeopleList: new Map(),
    categorizedBookmarkList: new Map(),
    profileBadges: new Map(),
    badgeDefinition: new Map(),
    longFormContent: new Map(),
    applicationSpecificData: new Map(),
    regularEvents: new Map(),
    replaceableEvents: new Map(),
    ephemeralEvents: new Map(),
    parameterizedReplaceableEvents: new Map(),
  };

  relays: RelaysState = {
    notice: new Map(),
    auth: new Map(),
  };
}

export interface EventsState {
  metadata: Map<string, NostrEvent>; // 0
  shortTextNote: Map<string, NostrEvent>; // 1
  recommendRelay: Map<string, NostrEvent>; // 2
  contacts: Map<string, NostrEvent>; // 3
  encryptedDirectMessages: Map<string, NostrEvent>; // 4
  eventDeletion: Map<string, NostrEvent>; // 5
  reposts: Map<string, NostrEvent>; // 6
  reaction: Map<string, NostrEvent>; // 7
  badgeAward: Map<string, NostrEvent>; // 8
  channelCreation: Map<string, NostrEvent>; // 40
  channelMetadata: Map<string, NostrEvent>; // 41
  channelMessage: Map<string, NostrEvent>; // 42
  channelHideMessage: Map<string, NostrEvent>; // 43
  channelMuteUser: Map<string, NostrEvent>; // 44
  reporting: Map<string, NostrEvent>; // 1984
  zapRequest: Map<string, NostrEvent>; // 9734
  zap: Map<string, NostrEvent>; // 9735
  muteList: Map<string, NostrEvent>; // 10000
  relayListMetadata: Map<string, NostrEvent>; // 10002
  clientAuthentication: Map<string, NostrEvent>; // 22242
  nostrConnect: Map<string, NostrEvent>; // 24133
  categorizedPeopleList: Map<string, NostrEvent>; // 30000
  categorizedBookmarkList: Map<string, NostrEvent>; // 30001
  profileBadges: Map<string, NostrEvent>; // 30008
  badgeDefinition: Map<string, NostrEvent>; // 30009
  longFormContent: Map<string, NostrEvent>; // 30023
  applicationSpecificData: Map<string, NostrEvent>; // 30078
  regularEvents: Map<string, NostrEvent>; // 1000-9999
  replaceableEvents: Map<string, NostrEvent>; // 10000-19999
  ephemeralEvents: Map<string, NostrEvent>; // 20000-29999
  parameterizedReplaceableEvents: Map<string, NostrEvent>; // 30000-39999
}

export interface RelaysState {
  notice: Map<string, NoticeItem>;
  auth: Map<string, AuthItem>;
}

export interface NoticeItem {
  relay: string;
  notice: string;
  timestamp: number;
}

// https://github.com/nostr-protocol/nips/blob/master/42.md
export interface AuthItem {
  relay: string;
  notice: string;
  timestamp: number;
}
