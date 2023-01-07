import { Event, Relay, Sub } from 'nostr-tools';

export interface Circle {
  id?: number;
  name: string;
  color: string;
  style: string;
  created?: number;
  modified?: number;
  public: boolean;
}

export interface Contact {
  pubkey: string;
  relay?: string;
  name?: string;
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

export interface NostrRelay extends Relay {
  // nip11: any;
  // error: string;
  metadata: NostrRelayDocument;
}

export interface NostrRelayDocument {
  id: string;
  read: boolean;
  write: boolean;
  nip11?: any;
  error?: string;
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

  lud06: string;

  display_name: string;

  website: string;
}

export interface NostrSubscription extends Sub {
  loading: boolean;
  timeout: any;
}

export interface NostrProfileDocument extends NostrProfile {
  pubkey: string;

  /** The timestamp when the profile was created. Internal property, not from event. */
  created: number;

  /** The timestamp when the profile was modified. Internal property, not from event. */
  modified?: number;

  /** Timestamp when user started following. */
  followed?: number;

  /** Timestamp when last retrieved. */
  retrieved?: number;

  /** The status against this profile, which can be: 0 = public, 1 = follow, 2 = mute, 3 = block */
  status?: ProfileStatus;

  circle?: number;

  /** List of domains where the user has been verified, e.g. "@nostr.directory", "@domain.com" */
  verifications: string[];

  /** Copy of the value from original event. */
  created_at?: number;
}

export interface CircleStyle {
  id: string;
  name: string;
}

export enum ProfileStatus {
  Public = 0,
  Follow = 1,
  Mute = 2,
  Block = 3,
}
