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

  details = false;

  toggleDetails() {
    this.details = !this.details;
  }

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
  hasFollowers = false;

  async ngOnInit() {
    this.appState.title = 'Following Notes';
    this.options.options.privateFeed = true;

    this.subscriptions.push(
      this.navigation.showMore$.subscribe(() => {
        this.showMore();
      })
    );

    const followList = await this.profileService.followList();
    this.hasFollowers = followList.length > 0;

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc
  }
}
