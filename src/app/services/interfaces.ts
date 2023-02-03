import { Event, Filter, Relay, Sub } from 'nostr-tools';

export interface Circle {
  id?: number;
  name: string;
  color: string;
  style: number;
  created?: number;
  modified?: number;
  public: boolean;
}

export interface MediaItem {
  artwork: string;
  title: string;
  artist: string;
  source: string;
  type: 'Music' | 'Podcast';
}

export interface Contact {
  pubkey: string;
  relay?: string;
  name?: string;
}

export interface QueryJob {
  type: 'Profile' | 'Event' | 'Contacts';
  identifier: string;
  // callback?: any;
  // limit?: number;
  // id?: string;
  // pubkeys: string[]; // Using array instead of singular job makes everything harder.
  // ids: string[];
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
  // subscriptions: Sub[];
}

export interface NostrRelaySubscription {
  id: string;
  // subid: string;
  sub?: NostrSub;
  filters: Filter[];
}

export interface StateDocument {
  id: number;
  since: number;
  modified?: number;
}

export interface NostrRelayDocument {
  url: string;
  // read: boolean;
  // write: boolean;
  nip11?: any;
  error?: string;
  // enabled?: boolean;
  public: boolean;
  profile?: boolean;
  status?: number;
  modified?: number;
  type: number;
  timeouts?: number;
  eventcount?: number;
}

/** OBSOLETE */
export interface NostrEvent extends Event {
  contentCut: boolean;
  tagsCut: boolean;
}

export interface NostrSub extends Sub {
  // id: string;
}

export interface NostrEventDocument extends Event {
  contentCut: boolean;
  tagsCut: boolean;
}

export interface NostrThreadEventDocument extends Event {
  replies: NostrThreadEventDocument[];
}

export interface ThreadEntryChild {
  id: string;
  date: number;
}

export interface ThreadEntry {
  id: string;
  // children: string[];
  children: ThreadEntryChild[];
  reactions: { [key: string]: [] };
  boosts: number;
}

export enum EmojiEnum {
  [`👍`] = `👍`,
  [`👎`] = `👎`,
}

export interface NostrNoteDocument extends NostrEventDocument {
  /** The timestamp when the note was saved. */
  saved: number;
}

export interface NostrProfile {
  name: string;
  about: string;
  picture: string;
  banner?: string;

  /** https://github.com/nostr-protocol/nips/blob/master/05.md */
  nip05: string;

  /** LNURL */
  lud06?: string;

  /** LN Alias */
  lud16?: string;

  display_name: string;

  website: string;
}

export interface NostrSubscription extends Sub {
  loading: boolean;
  timeout: any;
}

export interface NostrProfileDocument extends NostrProfile {
  /** The npub encoded public key. */
  npub: string;

  /** The public key in hex encoding. */
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
  status: ProfileStatus;

  circle?: number;

  /** List of domains where the user has been verified, e.g. "@nostr.directory", "@domain.com" */
  verifications: string[];

  /** Copy of the value from original event. */
  created_at?: number;

  following?: string[];

  relays?: any;
}

export interface CircleStyle {
  id: number;
  name: string;
}

export enum ProfileStatus {
  Public = 0,
  Follow = 1,
  Mute = 2,
  Block = 3,
}

export interface UserModel {
  id: number;
  username: string;
  name: string;
  cover: string;
  status: string;
  bio: string;
}

export interface MessageModel {
  id: number;
  cover: string;
  message: string;
}

export interface CustomObjectModel {
  tmpl: string;
  data: any;
  formatted?: string;
}

export class ChatModel {
  'id': number;
  'targetUserId': number;
  'username': string;
  'cover': string;
  'lastMessage': string;
  'lastMessageLength': string | number;
  'chat': Array<MessageModel>;
}

export interface LabelModel {
  id: string;
  name: string;
}
