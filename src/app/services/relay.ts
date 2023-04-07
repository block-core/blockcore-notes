import { Injectable } from '@angular/core';
import { LoadMoreOptions, NostrRelay, NostrRelayDocument, NostrRelaySubscription, QueryJob } from './interfaces';
import { Observable, BehaviorSubject } from 'rxjs';
import { Event, Filter, Kind } from 'nostr-tools';
import { EventService } from './event';
import { OptionsService } from './options';
import { ApplicationState } from './applicationstate';
import { StorageService } from './storage';
import { RelayType } from '../types/relay';
import { RelayResponse } from './messages';
import { ProfileService } from './profile';
import { Utilities } from './utilities';
import { v4 as uuidv4 } from 'uuid';
import { QueueService } from './queue.service';
import { UIService } from './ui';
import { NostrService } from './nostr';
import { ArticleService } from './article';
import { LoggerService } from './logger';
import { BadgeService } from './badge';
import { ZapUiService } from './zap-ui';
import { StateService } from './state';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  items: NostrRelayDocument[] = [];

  threadSubscription?: string;

  profileEventSubscription?: string;

  circleEventSubscription?: string;

  subs: Map<string, NostrRelaySubscription> = new Map();

  /** These are relay instances that have connection over WebSocket and holds a reference to database metadata for the relay. */
  relays: NostrRelay[] = [];

  #relaysChanged: BehaviorSubject<NostrRelay[]> = new BehaviorSubject<NostrRelay[]>(this.relays);

  workers: RelayType[] = [];

  get relays$(): Observable<NostrRelay[]> {
    return this.#relaysChanged.asObservable();
  }

  constructor(
    private badgeService: BadgeService,
    private logger: LoggerService,
    private articleService: ArticleService,
    private nostr: NostrService,
    private ui: UIService,
    private queue: QueueService,
    private utilities: Utilities,
    private profileService: ProfileService,
    private db: StorageService,
    private options: OptionsService,
    private eventService: EventService,
    private appState: ApplicationState,
    private zapUi: ZapUiService,
    private stateService: StateService,
    private snackBar: MatSnackBar
  ) {
    // Whenever the visibility becomes visible, run connect to ensure we're connected to the relays.
    this.appState.visibility$.subscribe((visible) => {
      if (visible) {
        this.createRelayWorkers();
      }
    });

    this.queue.queues$.subscribe((job) => {
      if (job) {
        this.enque(job);
      }
    });

    this.ui.loadMore$.subscribe((options?: LoadMoreOptions) => {
      if (!options || !options.until) {
        return;
      }

      if (options.type == 'profile') {
        if (!this.profileEventSubscription) {
          return;
        }

        // First unsubscribe the current.
        this.unsubscribe(this.profileEventSubscription);

        // Then create a new subscription:
        const kinds = this.options.values.enableReactions ? [Kind.Text, Kind.Reaction, 6] : [Kind.Text, 6];

        if (this.options.values.enableZapping) {
          kinds.push(Kind.Zap);
        }

        this.profileEventSubscription = this.subscribe([{ authors: [this.ui.profile!.pubkey], kinds: kinds, until: options.until, limit: 100 }]).id;
      } else if (options.type == 'feed') {
        // If there are no subscription yet, just skip load more.
        if (!this.circleEventSubscription) {
          return;
        }

        if (this.circleEventSubscription) {
          this.unsubscribe(this.circleEventSubscription);
          this.circleEventSubscription = undefined;
        }

        let pubkeys = [];

        // Get all authors in the circle.
        if (options.circle! > -1) {
          pubkeys = this.profileService.following.filter((f) => f.circle == options.circle).map((p) => p.pubkey);
        } else {
          pubkeys = this.profileService.following.map((p) => p.pubkey);
        }

        // Then create a new subscription:
        const kinds = this.options.values.enableReactions ? [Kind.Text, Kind.Reaction, 6] : [Kind.Text, 6];

        if (this.options.values.enableZapping) {
          kinds.push(Kind.Zap);
        }

        this.circleEventSubscription = this.subscribe([{ authors: pubkeys, kinds: kinds, until: options.until, limit: 100 }], 'feed').id;
      }
    });

    this.ui.circle$.subscribe((circle?: number) => {
      if (circle == null) {
        return;
      }

      let pubkeys = [];

      // Get all authors in the circle.
      if (circle! > -1) {
        pubkeys = this.profileService.following.filter((f) => f.circle == circle).map((p) => p.pubkey);
      } else {
        pubkeys = this.profileService.following.map((p) => p.pubkey);
      }

      if (this.circleEventSubscription) {
        this.unsubscribe(this.circleEventSubscription);
        this.circleEventSubscription = undefined;
      }

      const kinds = this.options.values.enableReactions ? [Kind.Text, Kind.Reaction, 6] : [Kind.Text, 6];

      if (this.options.values.enableZapping) {
        kinds.push(Kind.Zap);
      }

      this.circleEventSubscription = this.subscribe([{ authors: pubkeys, kinds: kinds, limit: 100 }], 'feed').id;
    });

    // Whenever the pubkey changes, we'll load the profile and start loading the user's events.
    // If the ID is reset, we'll also unsubscribe the subscription.
    this.ui.pubkey$.subscribe(async (id) => {
      if (!id) {
        if (this.profileEventSubscription) {
          this.unsubscribe(this.profileEventSubscription);
          this.profileEventSubscription = undefined;
        }

        return;
      }

      const profile = await this.profileService.getProfile(id);

      if (profile) {
        this.ui.setProfile(profile);
      }

      this.zapUi.reset();

      // else {
      //   this.enque({ type: 'Profile', identifier: id });
      // }
      // Subscribe to events and zaps (received) for the current user profile.
      this.profileEventSubscription = this.subscribe([
        { ['#p']: [id], kinds: [Kind.Zap] },
        { authors: [id], kinds: [Kind.Text, Kind.Reaction, 6], limit: 100 },
      ]).id;
    });

    // Whenever the event ID changes, we'll attempt to load the event.
    this.ui.eventId$.subscribe(async (id) => {
      if (!id) {
        return;
      }

      const event = await this.db.storage.getEvent(id);

      if (!event) {
        this.enque({ type: 'Event', identifier: id });
      } else {
        this.ui.setEvent(event);
      }
    });

    // Whenever the active UI event is changed, we'll subscribe to the thread of events and keep
    // updating the events to render in the UI. We will also load the immediate parent event.
    this.ui.event$.subscribe(async (event) => {
      // If the event is empty, we'll clear the existing events first.
      if (!event) {
        // Is this redudant?
        this.ui.clearEvents();

        if (this.threadSubscription) {
          this.unsubscribe(this.threadSubscription);
          this.threadSubscription = undefined;
        }

        return;
      }

      if (this.threadSubscription != event?.id) {
        // Unsubscribe the previous thread subscription.
        if (this.threadSubscription) {
          this.unsubscribe(this.threadSubscription);
        }

        this.threadSubscription = this.subscribe([{ ['#e']: [event.id!] }]).id;

        if (event.parentEventId) {
          const parentEvent = await this.db.storage.getEvent(event.parentEventId);

          if (parentEvent) {
            this.ui.setParentEvent(parentEvent);
          } else {
            this.enque({ type: 'Event', identifier: event.parentEventId! });
          }
        }
      }
    });
  }

  terminate(url: string) {
    const worker = this.workers.find((r) => r.url == url);

    if (worker) {
      worker.terminate();
    }
  }

  terminateAll() {
    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.terminate();
    }
  }

  async setRelayType(url: string, type: number) {
    const relay = await this.db.storage.getRelay(url);
    const item = this.items.find((r) => r.url == url);

    if (relay) {
      relay.type = type;
      item!.type = type;
      await this.db.storage.putRelay(relay);
    }
  }

  async setRelayPublic(url: string, publicRelay: boolean) {
    const relay = await this.db.storage.getRelay(url);
    const item = this.items.find((r) => r.url == url);

    if (relay) {
      relay.public = publicRelay;
      item!.public = publicRelay;
      await this.db.storage.putRelay(relay);
    }
  }

  async setRelayStatus(url: string, status: number) {
    this.logger.debug('setRelayStatus:', status);
    const relay = await this.db.storage.getRelay(url);
    const item = this.items.find((r) => r.url == url);

    if (relay) {
      relay.status = status;
      item!.status = status;
      await this.db.storage.putRelay(relay);
    }
  }

  async setRelayEnabled(url: string, enabled: boolean) {
    this.logger.debug('setRelayEnabled:', enabled);
    const relay = await this.db.storage.getRelay(url);
    const item = this.items.find((r) => r.url == url);

    if (relay) {
      relay.enabled = enabled;
      item!.enabled = enabled;
      await this.db.storage.putRelay(relay);
    }
  }

  setRelayTimeout(url: string, status: number) {
    const item = this.items.find((r) => r.url == url);

    if (item) {
      if (item.timeouts == null) {
        item.timeouts = 0;
      }

      item.timeouts++;
    }
  }

  setRelayCounter(url: string) {
    const item = this.items.find((r) => r.url == url);

    if (item) {
      if (item.eventcount == null) {
        item.eventcount = 0;
      }

      item.eventcount++;
    }
  }

  async setRelayNIP11(url: string, data: any) {
    const relay = await this.db.storage.getRelay(url);
    const item = this.items.find((r) => r.url == url);

    if (relay) {
      if (data.error) {
        relay.error = data.error;
        item!.error = data.error;
      } else {
        relay.error = undefined;
        item!.error = undefined;
        relay.nip11 = data;
        item!.nip11 = data;
      }

      await this.db.storage.putRelay(relay);
    }
  }

  async addRelay(url: string, read: boolean, write: boolean) {
    let relay = this.items.find((r) => r.url == url);
    let type = 1; // Read/Write by default.

    if (write && !read) {
      type = 3;
    } else if (!write && read) {
      type = 2;
    }

    if (!relay) {
      relay = {
        enabled: true,
        public: true,
        url: url,
        type: type,
      };

      this.db.storage.putRelay(relay);
      this.items.push(relay);
    } else {
      if (relay.enabled == null) {
        relay.enabled = true;
      }

      if (relay.type !== type) {
        relay.type = type;
        this.db.storage.putRelay(relay);
      }
    }

    if (type < 3) {
      this.createRelayWorker(relay.url);
    } else {
      this.terminate(relay.url);
    }
  }

  async deleteRelays(keepRelays: string[]) {
    // Relays to remove
    const relaysToRemove = this.items.filter((r) => keepRelays.indexOf(r.url) == -1);

    this.logger.debug('relaysToRemove:', relaysToRemove);

    for (let index = 0; index < relaysToRemove.length; index++) {
      const relay = relaysToRemove[index];
      await this.db.storage.deleteRelay(relay.url);

      this.logger.info(`${relay.url}: Deleted from database.`);

      const worker = this.workers.find((w) => w.url == relay.url);
      this.logger.info(`${relay.url}: Terminating this Web Worker!`, worker?.url);

      worker?.terminate();
    }

    // Relays to keep
    this.items = this.items.filter((r) => keepRelays.indexOf(r.url) > -1);

    // await this.db.storage.deleteRelays();

    // for (let i = 0; i < this.workers.length; i++) {
    //   const worker = this.workers[i];
    //   worker.terminate();
    // }

    // this.items2 = [];
  }

  async processEvent(response: RelayResponse) {
    const originalEvent = response.data;
    const event = this.eventService.processEvent(originalEvent);

    if (!event) {
      return;
    }

    this.logger.debug('SAVE EVENT?:', event);

    this.stateService.addEvent(event);

    if (event.kind == Kind.Zap) {
      this.zapUi.addZap(event);
    }

    if (response.subscription) {
      const sub = this.subs.get(response.subscription);
      if (sub) {
        if (sub.type == 'Event') {
          const index = sub.events.findIndex((e) => e.id == event.id);

          if (index === -1) {
            sub.events.push(event);
          }
        } else if (sub.type == 'Profile') {
          const index = sub.events.findIndex((e) => e.pubkey == event.pubkey);

          if (index > -1) {
            if (event.created_at >= sub.events[index].created_at) {
              sub.events[index] = event;
            }
          } else {
            sub.events.push(event);
          }
        } else if (sub.type == 'Contacts') {
          const index = sub.events.findIndex((e) => e.pubkey == event.pubkey);

          if (index > -1) {
            if (event.created_at >= sub.events[index].created_at) {
              sub.events[index] = event;
            }
          } else {
            sub.events.push(event);
          }
        } else if (sub.type == 'Replaceable') {
          const index = sub.events.findIndex((e) => e.pubkey == event.pubkey && this.eventService.firstDTag(e) == this.eventService.firstDTag(event));

          if (index > -1) {
            if (event.created_at > sub.events[index].created_at) {
              sub.events[index] = event;
              await this.badgeService.putDefinition(event);
            }
          } else {
            sub.events.push(event);
            await this.badgeService.putDefinition(event);
          }

          // Skip further processing, the correct consumer has received the event.
          return;
        }
      }
    }

    if (response.subscription == 'feed') {
      this.ui.putFeedEvent(event);
    } else if (response.subscription == 'notifications') {
      // If the event is a result of notification subscription, we'll parse and update the notification history.
      let notification = await this.db.storage.getNotification(event.id!);

      if (!notification) {
        let msg = '';

        if (event.kind == Kind.Reaction) {
          let content = event.content;

          if (content === '+' || content === '') {
            content = '❤️';
          } else if (content === '-') {
            content = '💔';
          }

          msg = content;
        } else if (event.kind == Kind.Text) {
          msg = `replied to your note.`;
        } else if (event.kind == Kind.Contacts) {
          msg = `started following you.`;

          // People can get spammed with "following" you, so we'll only store a single pr public key.
          let existingFollowingNotification = await this.db.storage.getNotification(event.pubkey);

          if (existingFollowingNotification) {
            return;
          } else {
            // Use the pubkey as identifier for this kind of event.
            event.id = event.pubkey;
          }
        } else if ((event.kind as number) == 6) {
          msg = `boosted your note.`;
        } else {
          msg = `Event kind ${event.kind} notification.`;
        }

        const lastETag = this.eventService.lastETag(event);

        notification = {
          id: event.id!,
          relatedId: lastETag,
          kind: event.kind,
          pubkey: event.pubkey,
          message: msg,
          seen: false,
          created: event.created_at,
        };

        await this.db.storage.putNotification(notification);
        this.ui.putNotification(notification);
      }
    }

    if ((event.kind as number) == 30009) {
      await this.badgeService.putDefinition(event);
    } else if (event.kind == Kind.Article) {
      this.articleService.put(event);
    } else if (event.kind == Kind.Metadata) {
      // This is a profile event, store it.
      const nostrProfileDocument = this.utilities.mapProfileEvent(event);

      if (nostrProfileDocument) {
        const profile = await this.profileService.updateProfile(nostrProfileDocument.pubkey, nostrProfileDocument);

        if (this.ui.pubkey == event.pubkey) {
          this.ui.setProfile(profile);
        }
      }
    } else if (event.kind == Kind.Contacts) {
      const pubkey = this.appState.getPublicKey();

      // If the event is for logged on user...
      if (event.pubkey === pubkey) {
        let existingContacts = await this.db.storage.getContacts(pubkey);

        if (!existingContacts || existingContacts.created_at < event.created_at) {
          await this.db.storage.putContacts(event);

          // Whenever we download the contacts document, we'll refresh the RELAYS and FOLLOWING
          // on the profile in question.
          const following = event.tags.map((t) => t[1]);

          // Make sure we run update and not put whenever we download the latest profile.
          this.profileService.followingAndRelays(event.pubkey, following, event.content);

          existingContacts = event;

          // const following = await this.db.storage.getProfilesByStatusCount(ProfileStatus.Follow);

          // if (following == 0) {
          // If we have already imported a newer, ignore the rest of the code.
          // if (this.currentDisplayedContacts && this.currentDisplayedContacts.created_at >= existingContacts.created_at) {
          //   return;
          // }

          const pubkeys = existingContacts.tags.map((t: any[]) => t[1]);
          const dialogData: any = { pubkeys: pubkeys, pubkey: pubkey, relays: [], relaysCount: 0 };

          if (existingContacts.content) {
            dialogData.relays = JSON.parse(existingContacts.content);
            dialogData.relaysCount = Object.keys(dialogData.relays).length;
          }

          // If there are no following in the file, skip.
          if (dialogData.pubkeys.length > 0 || dialogData.relaysCount > 0) {
            // this.currentDisplayedContacts = existingContacts;

            if (dialogData.relaysCount > 0) {
              const relayUrls = this.utilities.getRelayUrls(dialogData.relays);

              await this.deleteRelays(relayUrls);
              await this.appendRelays(dialogData.relays);
            }

            const following = dialogData.pubkeys;

            for (let i = 0; i < following.length; i++) {
              const publicKey = following[i];

              // Only follow if we're not already following.
              if (!this.profileService.isFollowing(publicKey)) {
                this.logger.info('Add follow to ' + publicKey);
                this.profileService.follow(publicKey);
              }
            }
          }
        }
      } else {
        const existingContacts = await this.db.storage.getContacts(event.pubkey);

        if (existingContacts && existingContacts.created_at >= event.created_at) {
          return;
        }

        await this.db.storage.putContacts(event);

        const following = event.tags.map((t) => t[1]);

        const profile = await this.profileService.followingAndRelays(event.pubkey, following, event.content);

        // If we received the following and relays for the current user, trigger profile changed event.
        if (profile && this.ui.pubkey == profile.pubkey) {
          this.ui.setProfile(profile, true);
        }
      }
    } else {
      // const index = this.profileService.followingKeys.indexOf(event.pubkey);

      // If the event we received is from someone the user is following, always persist it if not already persisted.
      // if (index > -1) {
      //   await this.db.storage.putEvents(event);
      // } else if (event.pubkey === this.appState.getPublicKey()) {
      //   // If user's own event, also persist.
      //   await this.db.storage.putEvents(event);
      // }

      // If the received event is what the user is currently looking at, update it.
      if (this.ui.eventId == event.id) {
        this.ui.setEvent(event);
      } else if (this.ui.parentEventId == event.id) {
        this.ui.setParentEvent(event);
      } else if (this.ui.pubkey == event.pubkey) {
        // If the event belongs to current visible profile.
        this.ui.putEvent(event);
      } else {
        // TODO: When viewing a profile, reactions of 7 will come here... Add logic to calculate reactions!

        // If we receive event on the thread subscription, and only then, update the events array.
        if (response.subscription == this.threadSubscription) {
          this.ui.putEvent(event);
        }
      }
    }
  }

  enque(job: QueryJob) {
    // Enque the job on all web workers.
    this.action('enque', job);
  }

  async handleRelayMessage(ev: MessageEvent, url: string) {
    const response = ev.data as RelayResponse;

    switch (response.type) {
      case 'failure':
        this.logger.debug(`Relay ${url} failure: ${response.data}.`);

        this.snackBar.open(`Failure: ${response.data}. (${url})`, 'Hide', {
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });

        break;
      case 'timeout':
        this.logger.debug(`Relay ${url} timeout: ${response.data}.`);
        this.setRelayTimeout(url, response.data);
        break;
      case 'status':
        this.logger.debug(`Relay ${url} changed status to ${response.data}.`);
        await this.setRelayStatus(url, response.data);

        // Upon first successful connection, we'll set the status to online.
        // Upon status set to 1, make sure we subscribe to the existing subscriptions.
        if (response.data === 1) {
          this.appState.updateConnectionStatus(true);

          const index = this.workers.findIndex((v) => v.url == url);
          const worker = this.workers[index];

          this.subs.forEach((sub) => {
            worker.subscribe(sub.filters, sub.id);
          });

          // for (let index = 0; index < this.subs2.length; index++) {
          //   const sub = this.subs2[index];
          //   worker.subscribe(sub.filters, sub.id);
          // }
        }

        break;
      case 'terminated':
        // When being terminated, we'll remove this worker from the array.
        this.logger.info(`${url}: WE HAVE TERMINATED`);
        const index = this.workers.findIndex((v) => v.url == url);

        // Set the status and then terminate this instance.
        const worker = this.workers[index];
        worker.status = 'terminated';

        this.logger.debug(`${url}: Calling actually TERMINATE on Web Worker!`);
        // Perform the actual termination of the Web Worker.
        worker.worker?.terminate();

        // Remove from list of workers.
        if (index > -1) {
          this.workers.splice(index, 1);
        }

        await this.setRelayStatus(url, -1);

        break;
      case 'event':
        // console.log('EVENT FROM:', url);
        this.setRelayCounter(url);
        await this.processEvent(response);
        break;
      case 'nip11':
        // console.log('EVENT FROM:', url);
        await this.setRelayNIP11(url, response.data);
        break;
    }
  }

  async handleRelayError(ev: ErrorEvent, url: string) {
    const response = ev.error as RelayResponse;
    await this.setRelayStatus(url, -1);

    console.warn('ERROR IN WEB WORKER FOR RELAY!', ev);
    console.warn('ERROR IN WEB WORKER FOR RELAY22!', ev.error);
  }

  /** Provide the event for a one-shot publish and disconnect. */
  createRelayWorker(url: string, event?: any) {
    if (!url) {
      console.warn('SUPPLIED EMPTY URL TO CREATE RELAY WORKER!');
      return;
    }

    const index = this.workers.findIndex((v) => v.url == url);

    // Avoid adding duplicate workers, but make sure we initiate a connect action.
    if (index > -1) {
      this.logger.debug(`${url}: This relay already exists, calling connect on it.`);
      this.workers[index].connect(undefined, event);
      return;
    }

    const relayType = new RelayType(url);
    this.logger.info(`${url}: Creating this web worker.`);

    // Append the worker immediately to the array.
    this.workers.push(relayType);

    const worker = relayType.start();

    worker.onmessage = async (ev) => {
      this.logger.debug(`${relayType.url}: onmessage`, ev.data);
      await this.handleRelayMessage(ev, relayType.url);
    };

    worker.onerror = async (ev) => {
      this.logger.error(`${relayType.url}: onerror`, ev.error);
      await this.handleRelayError(ev, relayType.url);
    };

    relayType.connect(Array.from(this.subs.values()), event);

    // console.table(this.workers);
  }

  getActiveRelay(url: string) {
    const index = this.relays.findIndex((r) => r.url == url);

    if (index == -1) {
      return null;
    } else {
      return this.relays[index];
    }
  }

  /** Takes relay in the format used for extensions and adds to persistent storage. */
  async appendRelays(relays: any) {
    let preparedRelays = relays;

    if (Array.isArray(preparedRelays)) {
      preparedRelays = {};

      for (let i = 0; i < relays.length; i++) {
        preparedRelays[relays[i]] = {};
      }
    }

    const entries = Object.keys(preparedRelays);

    for (var i = 0; i < entries.length; i++) {
      const key = entries[i];
      const val = preparedRelays[key];
      await this.addRelay(key, val.read, val.write);
    }
  }

  /** read/write is currently ignored, should be changed to type. */
  async appendRelay(url: string, read: boolean, write: boolean) {
    await this.addRelay(url, read, write);
  }

  async deleteRelay(url: string) {
    const index = this.items.findIndex((r) => r.url == url);

    if (index == -1) {
      return;
    }

    const worker = this.workers.find((w) => w.url == url);
    worker?.terminate();

    await this.db.storage.deleteRelay(url);
    this.items.splice(index, 1);
  }

  connectedRelays() {
    return this.relays.filter((r) => r.status === 1);
  }

  /** Queues up subscription that will be activated whenever the relay is connected. */
  queueSubscription(filters: Filter[]) {
    const id = uuidv4();
    this.subs.set(id, { id: id, filters: filters, events: [], type: 'Event' });
    // this.subs2.push({ id: id, filters: filters, events: [] });
    return id;
  }

  subscribe(filters: Filter[], id?: string, type: string = 'Event') {
    if (!id) {
      id = uuidv4();
    }

    const sub = { id: id, filters: filters, events: [], type: type };

    // this.action('subscribe', { filters, id });
    this.subs.set(id, sub);
    // this.subs2.push({ id: id, filters: filters, events: [] });

    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.subscribe(filters, id);
    }

    // this.sub = this.relayService.workers[0].subscribe([{ authors: [this.appState.getPublicKey()], kinds: [1] }]);
    return sub;
  }

  download(filters: Filter[], id?: string, type: string = 'Event') {
    if (!id) {
      id = uuidv4();
    }

    const sub = { id: id, filters: filters, events: [], type: type };

    // this.action('subscribe', { filters, id });
    this.subs.set(id, sub);
    // this.subs2.push({ id: id, filters: filters, events: [] });

    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.download(filters, id, type);
    }

    // this.sub = this.relayService.workers[0].subscribe([{ authors: [this.appState.getPublicKey()], kinds: [1] }]);
    return sub;
  }

  action(action: string, data: any) {
    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.action(action, data);
    }

    // Spin up all the write-only relays temporarily when kind is contacts or metadata.
    if (action === 'publish') {
      // Get all relays that are write-only
      const filteredRelays = this.items.filter((r) => r.type == 3);

      for (let index = 0; index < filteredRelays.length; index++) {
        const relay = filteredRelays[index];
        this.createRelayWorker(relay.url, data);
      }
    }
  }

  publish(data: any) {
    this.action('publish', data);
  }

  unsubscribe(id: string) {
    for (let index = 0; index < this.workers.length; index++) {
      const worker = this.workers[index];
      worker.unsubscribe(id);
    }

    this.subs.delete(id);
  }

  createRelayWorkers() {
    for (let index = 0; index < this.items.length; index++) {
      const relay = this.items[index];

      if (relay.enabled && relay.type < 3) {
        this.createRelayWorker(relay.url);
      }
    }
  }

  async initialize() {
    this.items = await this.db.storage.getRelays();

    // If there are no relay metatadata in database, get it from extension or default
    if (this.items.length == 0) {
      let relays = await this.nostr.relays();

      // First append whatever the extension give us of relays.
      await this.appendRelays(relays);
    }

    this.createRelayWorkers();
  }
}
