import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { SettingsService } from '../services/settings.service';
import { map, Observable, shareReplay, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FeedService } from '../services/feed.service';
import { OptionsService } from '../services/options.service';
import { NavigationService } from '../services/navigation.service';
import { ScrollEvent } from '../shared/scroll.directive';

interface DefaultProfile {
  pubkey: string;
  pubkeyhex: string;
  name: string;
  picture: string;
  about: string;
  checked: boolean;
}

@Component({
  selector: 'app-feed-private',
  templateUrl: './feed-private.component.html',
  styleUrls: ['./feed-private.component.css'],
})
export class FeedPrivateComponent {
  publicKey?: string | null;

  defaults: DefaultProfile[] = [
    {
      pubkey: 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6',
      pubkeyhex: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
      name: 'fiatjaf',
      picture: 'https://pbs.twimg.com/profile_images/539211568035004416/sBMjPR9q_normal.jpeg',
      about: 'buy my merch at fiatjaf store',
      checked: false,
    },
    {
      pubkey: 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m',
      pubkeyhex: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
      name: 'jack',
      picture: 'https://pbs.twimg.com/profile_images/1115644092329758721/AFjOr-K8_normal.jpg',
      about: 'bitcoin...twttr/@jack',
      checked: false,
    },
    {
      pubkey: 'npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s',
      pubkeyhex: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
      name: 'jb55',
      picture: 'https://pbs.twimg.com/profile_images/1362882895669436423/Jzsp1Ikr_normal.jpg',
      about: 'damus.io author. bitcoin and nostr dev',
      checked: false,
    },
    {
      pubkey: 'npub1v4v57fu60zvc9d2uq23cey4fnwvxlzga9q2vta2n6xalu03rs57s0mxwu8',
      pubkeyhex: '65594f279a789982b55c02a38c92a99b986f891d2814c5f553d1bbfe3e23853d',
      name: 'hampus',
      picture: 'https://pbs.twimg.com/profile_images/1517505111991504896/9qixSAMn_normal.jpg',
      about: '',
      checked: false,
    },
  ];

  constructor(
    public navigation: NavigationService,
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public profileService: ProfileService,
    public feedService: FeedService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private ngZone: NgZone
  ) {
    console.log('HOME constructor!!'); // Hm.. called twice, why?
  }

  get eventsView$(): Observable<NostrEventDocument[]> {
    return this.feedService.events$.pipe(map((x) => x.slice(0, this.eventsCount)));
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
  }

  ngAfterContentInit() {
    console.log('ngAfterContentInit');
  }

  eventsCount = 10;

  showMore() {
    this.eventsCount += 10;
  }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    // this.events = this.validator.filterEvents(this.events);
  }

  activeOptions() {
    let options = '';

    const peopleCount = this.profileService.profiles.length;

    // options += `Viewing ${peopleCount} people`;

    // if (this.settings.options.hideSpam) {
    //   options += ' Spam: Filtered';
    // } else {
    //   options += ' Spam: Allowed';
    // }

    // if (this.settings.options.hideInvoice) {
    //   options += ' Invoices: Hidden';
    // } else {
    //   options += ' Invoices: Displayed';
    // }

    return options;
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  // events: NostrEvent[] = [];
  // sub: any;
  // relay?: Relay;
  // initialLoad = true;

  // onConnected(relay?: Relay) {
  //   if (!relay) {
  //     return;
  //   }

  //   const fiveMinutesAgo = moment().subtract(5, 'minutes').unix();

  //   this.sub = relay.sub([{ kinds: [1], since: fiveMinutesAgo }], {});

  //   this.events = [];

  //   this.sub.on('event', (originalEvent: any) => {
  //     if (this.settings.options.paused) {
  //       return;
  //     }

  //     const event = this.processEvent(originalEvent);

  //     if (!event) {
  //       return;
  //     }

  //     // If not initial load, we'll grab the profile.
  //     // if (!this.initialLoad) {
  //     this.fetchProfiles(relay, [event.pubkey]);
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

  details = false;

  toggleDetails() {
    this.details = !this.details;
  }

  // fetchProfiles(relay: Relay, authors: string[]) {
  //   // const filteredAuthors = authors.filter((a) => {
  //   //   return this.profile.profiles[a] == null;
  //   // });

  //   // console.log('authors:', authors);
  //   // console.log('filteredAuthors:', filteredAuthors);

  //   // if (filteredAuthors.length === 0) {
  //   //   return;
  //   // }

  //   const profileSub = relay.sub([{ kinds: [0], authors: authors }], {});

  //   profileSub.on('event', async (originalEvent: NostrEvent) => {
  //     const event = this.processEvent(originalEvent);

  //     if (!event) {
  //       return;
  //     }

  //     // const parsed = this.validator.sanitizeProfile(event);
  //     // const test1 = JSON.parse('{"name":"stat","picture":"https://i.imgur.com/s1scsdH_d.webp?maxwidth=640&amp;shape=thumb&amp;fidelity=medium","about":"senior software engineer at amazon\\n\\n#bitcoin","nip05":"stat@no.str.cr"}');
  //     // console.log('WHAT IS WRONG WITH THIS??');
  //     // console.log(test1);

  //     try {
  //       const profile = this.validator.sanitizeProfile(JSON.parse(event.content) as NostrProfileDocument) as NostrProfileDocument;

  //       // Persist the profile.
  //       await this.profile.putProfile(event.pubkey, profile);

  //       const displayName = encodeURIComponent(profile.name);
  //       const url = `https://www.nostr.directory/.well-known/nostr.json?name=${displayName}`;

  //       const rawResponse = await fetch(url, {
  //         method: 'GET',
  //         mode: 'cors',
  //       });

  //       if (rawResponse.status === 200) {
  //         const content = await rawResponse.json();
  //         const directoryPublicKey = content.names[displayName];

  //         if (event.pubkey === directoryPublicKey) {
  //           if (!profile.verifications) {
  //             profile.verifications = [];
  //           }

  //           profile.verifications.push('@nostr.directory');

  //           // Update the profile with verification data.
  //           await this.profile.putProfile(event.pubkey, profile);
  //         } else {
  //           // profile.verified = false;
  //           console.warn('Nickname reuse:', url);
  //         }
  //       } else {
  //         // profile.verified = false;
  //       }
  //     } catch (err) {
  //       console.warn('This profile event was not parsed due to errors:', event);
  //     }
  //   });

  //   profileSub.on('eose', () => {
  //     profileSub.unsub();
  //   });
  // }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
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

  async follow() {
    const pubKeys = this.defaults.filter((p) => p.checked);

    if (pubKeys.length === 0) {
      return;
    }

    for (let i = 0; i < pubKeys.length; i++) {
      console.log('LOOP KEY:', pubKeys[i]);
      await this.profileService.follow(pubKeys[i].pubkeyhex, undefined, pubKeys[i] as any);
    }

    await this.feedService.downloadRecent(pubKeys.map((p) => p.pubkeyhex));

    // Perform a detected changes now, since 'profileService.profiles.length' should be updated.
    this.cd.detectChanges();
  }

  subscriptions: Subscription[] = [];

  async ngOnInit() {
    this.appState.title = 'Following Notes';
    this.options.options.privateFeed = true;

    this.subscriptions.push(
      this.navigation.showMore$.subscribe(() => {
        this.showMore();
      })
    );

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc

    // if (this.relay) {
    //   return;
    // }

    // // const relay = relayInit('wss://relay.nostr.info');
    // this.relay = relayInit('wss://relay.damus.io');

    // this.relay.on('connect', () => {
    //   console.log(`connected to ${this.relay?.url}`);
    //   this.onConnected(this.relay);
    // });

    // this.relay.on('disconnect', () => {
    //   console.log(`DISCONNECTED! ${this.relay?.url}`);
    // });

    // this.relay.on('notice', () => {
    //   console.log(`NOTICE FROM ${this.relay?.url}`);
    // });

    // this.relay.connect();
  }
}
