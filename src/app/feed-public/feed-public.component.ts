import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { SettingsService } from '../services/settings.service';
import { NotesService } from '../services/notes.service';
import { map, Observable, shareReplay, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OptionsService } from '../services/options.service';

@Component({
  selector: 'app-feed-public',
  templateUrl: './feed-public.component.html',
})
export class FeedPublicComponent {
  publicKey?: string | null;

  constructor(
    public appState: ApplicationState,
    public options: OptionsService,
    private notesService: NotesService,
    public profile: ProfileService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    console.log('HOME constructor!!'); // Hm.. called twice, why?
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
  }

  ngAfterContentInit() {
    console.log('ngAfterContentInit');
  }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    this.events = this.validator.filterEvents(this.events);
  }

  activeOptions() {
    let options = '';

    if (this.options.options.hideSpam) {
      options += ' Spam: Filtered';
    } else {
      options += ' Spam: Allowed';
    }

    if (this.options.options.hideInvoice) {
      options += ' Invoices: Hidden';
    } else {
      options += ' Invoices: Displayed';
    }

    return options;
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  events: NostrEvent[] = [];
  sub: any;
  relay?: Relay;
  initialLoad = true;

  async follow(pubkey: string, circle?: string) {
    await this.profile.follow(pubkey, circle);
  }

  onConnected(relay?: Relay) {
    if (!relay) {
      return;
    }

    const fiveMinutesAgo = moment().subtract(5, 'minutes').unix();

    this.sub = relay.sub([{ kinds: [1], since: fiveMinutesAgo }], {});

    this.events = [];

    this.sub.on('event', (originalEvent: any) => {
      if (this.options.options.paused) {
        return;
      }

      const event = this.processEvent(originalEvent);

      if (!event) {
        return;
      }

      // If not initial load, we'll grab the profile.
      // if (!this.initialLoad) {
      this.fetchProfiles(relay, [event.pubkey]);
      // }

      this.events.unshift(event);

      this.ngZone.run(() => {
        this.cd.detectChanges();
      });

      if (this.events.length > 100) {
        this.events.length = 80;
      }
    });

    this.sub.on('eose', () => {
      this.initialLoad = false;

      const pubKeys = this.events.map((e) => {
        return e.pubkey;
      });

      // Initial load completed, let's go fetch profiles for those initial events.
      // this.fetchProfiles(relay, pubKeys);

      this.cd.detectChanges();
    });
  }

  processEvent(originalEvent: NostrEvent): NostrEvent | null {
    // Validate the event:
    let event = this.validator.validateEvent(originalEvent);

    if (!event) {
      debugger;
      console.log('INVALID EVENT!');
      return null;
    }

    event = this.validator.sanitizeEvent(event);
    // event = this.validator.filterEvent(event);

    if (!event) {
      return null;
    }

    return event;
  }

  details = false;

  toggleDetails() {
    this.details = !this.details;
  }

  fetchProfiles(relay: Relay, authors: string[]) {
    // const filteredAuthors = authors.filter((a) => {
    //   return this.profile.profiles[a] == null;
    // });

    // console.log('authors:', authors);
    // console.log('filteredAuthors:', filteredAuthors);

    // if (filteredAuthors.length === 0) {
    //   return;
    // }

    const profileSub = relay.sub([{ kinds: [0], authors: authors }], {});

    profileSub.on('event', async (originalEvent: NostrEvent) => {
      const event = this.processEvent(originalEvent);

      if (!event) {
        return;
      }

      // const parsed = this.validator.sanitizeProfile(event);
      // const test1 = JSON.parse('{"name":"stat","picture":"https://i.imgur.com/s1scsdH_d.webp?maxwidth=640&amp;shape=thumb&amp;fidelity=medium","about":"senior software engineer at amazon\\n\\n#bitcoin","nip05":"stat@no.str.cr"}');
      // console.log('WHAT IS WRONG WITH THIS??');
      // console.log(test1);

      try {
        const profile = this.validator.sanitizeProfile(JSON.parse(event.content) as NostrProfileDocument) as NostrProfileDocument;

        // Persist the profile.
        await this.profile.updateProfile(event.pubkey, profile);

        const displayName = encodeURIComponent(profile.name);
        const url = `https://www.nostr.directory/.well-known/nostr.json?name=${displayName}`;

        const rawResponse = await fetch(url, {
          method: 'GET',
          mode: 'cors',
        });

        if (rawResponse.status === 200) {
          const content = await rawResponse.json();
          const directoryPublicKey = content.names[displayName];

          if (event.pubkey === directoryPublicKey) {
            if (!profile.verifications) {
              profile.verifications = [];
            }

            profile.verifications.push('@nostr.directory');

            // Update the profile with verification data.
            await this.profile.updateProfile(event.pubkey, profile);
          } else {
            // profile.verified = false;
            console.warn('Nickname reuse:', url);
          }
        } else {
          // profile.verified = false;
        }
      } catch (err) {
        console.warn('This profile event was not parsed due to errors:', event);
      }
    });

    profileSub.on('eose', () => {
      profileSub.unsub();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }

    if (this.relay) {
      this.relay.close();
    }

    console.log('PUBLIC FEED DESTROYED!');
  }

  feedChanged($event: any, type: string) {
    if (type === 'public') {
      // If user choose public and set the value to values, we'll turn on the private.
      if (!this.options.options.publicFeed) {
        this.options.options.privateFeed = true;
      } else {
        this.options.options.privateFeed = false;
      }
    } else {
      // If user choose private and set the value to values, we'll turn on the public.
      if (!this.options.options.privateFeed) {
        this.options.options.publicFeed = true;
      } else {
        this.options.options.publicFeed = false;
      }
    }
  }

  // async optionsUpdated($event: any, type: any) {
  //   if (type == 1) {
  //     this.showCached = false;
  //   } else {
  //     this.showBlocked = false;
  //   }

  //   await this.load();
  // }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe('(max-width: 599px)').pipe(
    map((result) => result.matches),
    shareReplay()
  );

  async ngOnInit() {
    this.options.options.privateFeed = true;

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc

    this.appState.title = '';

    if (this.relay) {
      return;
    }

    // const relay = relayInit('wss://relay.nostr.info');
    this.relay = relayInit('wss://nostr-pub.wellorder.net');

    this.relay.on('connect', () => {
      console.log(`connected to ${this.relay?.url}`);
      this.onConnected(this.relay);
    });

    this.relay.on('disconnect', () => {
      console.log(`DISCONNECTED! ${this.relay?.url}`);
    });

    this.relay.on('notice', () => {
      console.log(`NOTICE FROM ${this.relay?.url}`);
    });

    this.relay.connect();
  }
}
