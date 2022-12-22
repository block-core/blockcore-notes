import { Event } from 'nostr-tools';

export interface NostrEvent extends Event {
  contentCut: boolean;
  tagsCut: boolean;
}

export interface NostrProfile {
  name: string;
  about: string;
  picture: string;
  verified: boolean;
}