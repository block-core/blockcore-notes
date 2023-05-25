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
  type: 'Music' | 'Podcast' | 'YouTube' | 'Video';
}

export interface Contact {
  pubkey: string;
  relay?: string;
  name?: string;
}

export interface QueryJob {
  type: 'Profile' | 'Event' | 'Contacts' | 'Article' | 'BadgeDefinition';
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
  nip11: any;
  // error: string;
  // metadata: NostrRelayDocument;
  // subscriptions: Sub[];
}

// export class NostrRelaySubscription {
//   constructor() {
//     connectedChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>([]);
//     this.visibility$ = this.visibilityChanged.asObservable();
//   }
// }

export interface NostrRelaySubscription {
  id: string;
  // subid: string;
  sub?: NostrSub;
  filters: Filter[];
  events: Event[];
  // events: Map<string, Event>;
  // events$: any;
  type: string | 'Profile' | 'Event' | 'Contacts' | 'Article' | 'BadgeDefinition';
}

export interface StateDocument {
  id: number;
  since: number;
  modified?: number;
  mediaQueue: MediaItem [];
}

export interface NostrRelayDocument {
  url: string;
  // read: boolean;
  // write: boolean;
  nip11?: any;
  error?: string;
  enabled: boolean;
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

export interface NostrArticle extends NostrEvent {
  slug?: string;
  title?: string;
  summary?: string;
  image?: string;
  published_at: number;
  metatags: string[];
}

export interface NostrBadgeDefinition extends NostrEvent {
  slug?: string;
  name?: string;
  description?: string;
  image?: string;
  thumb?: string;
  hashtags: string[];
}

export interface NostrSub extends Sub {
  // id: string;
}

export interface LoadMoreOptions {
  until?: number;
  circle?: number;
  type: string;
}

export interface NostrEventDocument extends Event {
  contentCut: boolean;
  tagsCut: boolean;

  replyEventId?: string;
  rootEventId?: string;
  parentEventId?: string;
}

export interface NostrThreadEventDocument extends Event {
  replies: NostrThreadEventDocument[];
}

export interface ThreadEntryChild {
  id: string;
  date: number;
}

export interface ThreadEntry {
  eventId: string;

  reactionIds: string[];

  // children: string[];
  // children: ThreadEntryChild[];
  reactions: { [key: string | symbol]: number };
  // reactions: {};
  boosts: number;
  zaps?: ParsedZap[];
}

export interface Zapper {
  pubkey?: string;
  isValid: boolean;
  content: string;
}

export interface ZappersListData {
  zaps: ParsedZap[] | undefined;
  event?: NostrEventDocument;
}

export interface ParsedZap {
  id: string;
  e?: string;
  p: string;
  amount: number;
  content: string;
  zapper?: string;
  valid: boolean;
  zapService: string;
}

export enum EmojiEnum {
  [`❤️`] = `❤️`,
  [`💔`] = `💔`,
}

// export enum EmojiEnum {
//   [`👍`] = `👍`,
//   [`👎`] = `👎`,
// }

export interface NostrNoteDocument extends NostrEventDocument {
  /** The timestamp when the note was saved. */
  saved: number;

  labels: string[];
}

export interface NostrProfile {
  name: string;
  about: string;
  picture: string | any;
  banner?: string | any;

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

export interface NostrBadgeDocument extends BadgeDefinitionEvent {
  /** The full identifier of the badge (30009:pubkey:slug) */
  id: string;

  /** The public key in hex encoding. */
  pubkey: string;

  /** The timestamp when the profile was created. Internal property, not from event. */
  created: number;

  /** The timestamp when the profile was modified. Internal property, not from event. */
  modified?: number;

  /** Timestamp when last retrieved. */
  retrieved?: number;

  created_at?: number;
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

export type TokenKeyword = {
  token: string;
  word?: string;
  safeWord?: any;
  tooltip?: string;
};

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

export interface NotificationModel {
  /** The event ID of the notification */
  id: string;

  /** The ID of event a reaction responds to. */
  relatedId?: string;

  pubkey: string;

  message: string;

  created: number;

  seen: boolean;

  kind: number;
}

export interface BlogEvent {
  title: string;

  content: string;

  summary?: string;

  image?: string;

  slug?: string;

  tags: string;

  published_at?: number;
}

export interface BadgeDefinitionEvent {
  pubkey?: string;

  name: string;

  description: string;

  image?: string;

  thumb?: string;

  slug?: string;

  hashtags: string[];
}

export interface Logger {
  trace(message?: any | (() => any), ...additional: any[]): void;

  debug(message?: any | (() => any), ...additional: any[]): void;

  info(message?: any | (() => any), ...additional: any[]): void;

  log(message?: any | (() => any), ...additional: any[]): void;

  warn(message?: any | (() => any), ...additional: any[]): void;

  error(message?: any | (() => any), ...additional: any[]): void;

  fatal(message?: any | (() => any), ...additional: any[]): void;
}

export interface LNURLPayRequest {
  allowsNostr?: boolean;
  nostrPubkey?: string;
  minSendable?: number;
  maxSendable?: number;
  metadata?: string;
  callback: string;
  commentAllowed?: number;
  status?: string;
}

export interface LNURLPayResponse {
  pr: string;
}

export interface LNURLInvoice {
  pr: string;
  successAction?: LNURLSuccessAction;
}

export interface LNURLSuccessAction {
  description?: string;
  url?: string;
}

export declare interface OnInitialized {
  initialize() : void;
}


// export interface ProfileView {

// }

// export interface EventView {

// }
