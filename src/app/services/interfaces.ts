import { Event } from 'nostr-tools';

export interface NostrEvent extends Event {
  contentCut: boolean;
  tagsCut: boolean;
}
