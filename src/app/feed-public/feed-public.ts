import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { NotesService } from '../services/notes';
import { map, Observable, shareReplay, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OptionsService } from '../services/options';

@Component({
  selector: 'app-feed-public',
  templateUrl: './feed-public.html',
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

    if (this.options.values.hideSpam) {
      options += ' Spam: Filtered';
    } else {
      options += ' Spam: Allowed';
    }

    if (this.options.values.hideInvoice) {
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

  async follow(pubkey: string, circle?: number) {
    await this.profile.follow(pubkey, circle);
  }

  // onConnected(relay?: Relay) {
  //   if (!relay) {
  //     return;
  //   }

  //   const fiveMinutesAgo = moment().subtract(5, 'minutes').unix();

  //   // Get the last 100 items.
  //   this.sub = relay.sub([{ kinds: [1], limit: 100 }], {});

  //   this.events = [];

  //   this.sub.on('event', (originalEvent: any) => {
  //     if (this.options.values.paused) {
  //       return;
  //     }

  //     const event = this.processEvent(originalEvent);

  //     if (!event) {
  //       return;
  //     }

  //     // If not initial load, we'll grab the profile.
  //     // if (!this.initialLoad) {
  //     // this.fetchProfiles(relay, [event.pubkey]);
  //     // }

  //     this.events.unshift(event);

  //     this.ngZone.run(() => {
  //       this.cd.detectChanges();
  //     });

  //     if (this.events.length > 100) {
  //       this.events.length = 80;
  //     }
  //   });

  //   this.sub.on('eose', () => {
  //     this.initialLoad = false;

  //     const pubKeys = this.events.map((e) => {
  //       return e.pubkey;
  //     });

  //     // Initial load completed, let's go fetch profiles for those initial events.
  //     // this.fetchProfiles(relay, pubKeys);

  //     this.cd.detectChanges();
  //   });
  // }

  // processEvent(originalEvent: NostrEvent): NostrEvent | null {
  //   // Validate the event:
  //   let event = this.validator.validateEvent(originalEvent);

  //   if (!event) {
  //     debugger;
  //     console.log('INVALID EVENT!');
  //     return null;
  //   }

  //   event = this.validator.sanitizeEvent(event);
  //   // event = this.validator.filterEvent(event);

  //   if (!event) {
  //     return null;
  //   }

  //   return event;
  // }

  details = false;

  toggleDetails() {
    this.details = !this.details;
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
      if (!this.options.values.publicFeed) {
        this.options.values.privateFeed = true;
      } else {
        this.options.values.privateFeed = false;
      }
    } else {
      // If user choose private and set the value to values, we'll turn on the public.
      if (!this.options.values.privateFeed) {
        this.options.values.publicFeed = true;
      } else {
        this.options.values.publicFeed = false;
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
    this.options.values.privateFeed = true;

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc

    this.appState.updateTitle('');

    if (this.relay) {
      return;
    }

    // const relay = relayInit('wss://relay.nostr.info');
    this.relay = relayInit('wss://nostr-pub.wellorder.net');

    this.relay.on('connect', () => {
      console.log(`connected to ${this.relay?.url}`);
      // this.onConnected(this.relay);
    });

    this.relay.on('disconnect', () => {
      console.log(`DISCONNECTED! ${this.relay?.url}`);
    });

    this.relay.on('notice', (msg: any) => {
      console.log(`NOTICE FROM ${this.relay?.url}: ${msg}`);
    });

    this.relay.connect();
  }
}
