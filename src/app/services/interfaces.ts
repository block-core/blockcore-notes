import { Event } from 'nostr-tools';

export interface Circle {
  id: string;
  name: string;
  color: string;
  created?: number;
  modified?: number;
}

export interface Action {
  tooltip: string;
  icon: string;
  click: any;
}

export interface Person {
  id: string;
  name: string;
  pubkey: string;
}

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

export interface NostrNoteDocument extends NostrEventDocument {
  /** The timestamp when the note was saved. */
  saved: number;
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

  /** The timestamp when the profile was created. Internal property, not from event. */
  created: number;

  /** The timestamp when the profile was modified. Internal property, not from event. */
  modified?: number;

  /** Indicates if the user is following this profile. If not, then the profile can be wiped during cache cleanup. */
  follow?: boolean;

  /** Indicates if a user is blocked and their content will not be shown. */
  block?: boolean;

  circle?: string;

  /** List of domains where the user has been verified, e.g. "@nostr.directory", "@domain.com" */
  verifications: string[];
}
