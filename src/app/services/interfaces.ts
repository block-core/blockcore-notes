import { Event } from 'nostr-tools';

export interface NostrDocument<T> {
  /** Reference to which relay we received this item from. */
  relay: '';

  /** The time we observed this entry. */
  time: number;

  /** The sanitized and validated entry from nostr relays. */
  item: T | NostrEventDocument | NostrProfileDocument;

  /** The raw and original entry, not filtered or sanitized. */
  raw: string;
}

/** OBSOLETE */
export interface NostrEvent extends Event {
  contentCut: boolean;
  tagsCut: boolean;
}

export interface NostrEventDocument extends Event {
  contentCut: boolean;
  tagsCut: boolean;
}

export interface NostrProfile {
  name: string;
  about: string;
  picture: string;

  /** https://github.com/nostr-protocol/nips/blob/master/05.md */
  nip05: string;
}

export interface NostrProfileDocument extends NostrProfile {
  pubkey: string; // Not stored in database, just used when retreiving.
  
  /** List of domains where the user has been verified, e.g. "@nostr.directory", "@domain.com" */
  verifications: string[];
}
