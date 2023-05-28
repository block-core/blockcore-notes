import { ChangeDetectorRef, Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation';
import { Circle, NostrEvent, NostrEventDocument, NostrProfile, NostrProfileDocument, ProfileStatus } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { OptionsService } from '../services/options';
import { NavigationService } from '../services/navigation';
import { CircleService } from '../services/circle';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { map, Observable, of, Subscription, tap, BehaviorSubject, finalize } from 'rxjs';
import { DataService } from '../services/data';
import { NotesService } from '../services/notes';
import { QueueService } from '../services/queue.service';
import { UIService } from '../services/ui';
import { StorageService } from '../services/storage';
import { MetricService } from '../services/metric-service';

@Component({
  selector: 'app-user',
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  // pubkey?: string | null;
  // npub!: string;
  // profile?: NostrProfileDocument;
  // about?: string;
  imagePath = '/assets/profile.png';
  profileName = '';
  circle?: Circle;
  initialLoad = true;

  // events: NostrEventDocument[] = [];
  // #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);
  // get events$(): Observable<NostrEventDocument[]> {
  //   return this.#eventsChanged.asObservable().pipe(map((data) => data.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))));
  // }

  // rootEvents$ = this.ui.events$
  //   .pipe(
  //     map((data) => {
  //       return data.filter((e) => e.tags.filter((p) => p[0] === 'e').length == 0);
  //     })
  //   )
  //   .pipe(map((x) => x.slice(0, this.eventsCount)));

  // replyEvents$ = this.ui.events$
  //   .pipe(
  //     map((data) => {
  //       return data.filter((e) => e.tags.filter((p) => p[0] === 'e').length > 0);
  //     })
  //   )
  //   .pipe(map((x) => x.slice(0, this.eventsCount)));

  // let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);

  // get events$(): Observable<NostrEventDocument[]> {
  //   return this.#eventsChanged.asObservable().pipe(
  //     map((data) => {
  //       data.sort((a, b) => {
  //         return a.created_at > b.created_at ? -1 : 1;
  //       });

  //       return data;
  //     })
  //   );
  // }

  // userEvents$!: any;
  // replyEvents$!: any;

  notes: NostrEventDocument[] = [];

  userEvents$ = of(this.notes);
  // .pipe(
  //   map((data) => {
  //     // debugger;
  //     return data.sort((a, b) => {
  //       debugger;
  //       return a.created_at > b.created_at ? 1 : -1;
  //     });
  //   })
  // )
  // .pipe(map((x) => x.slice(0, this.eventsCount)));

  // get eventsView$(): Observable<NostrEventDocument[]> {
  //   return this.feedService.events$.pipe(map((x) => x.slice(0, this.eventsCount)));
  // }

  //.pipe(map((objs) => objs.map((c) => c.created_at).sort((a, b) => (a > b ? 1 : -1)))); //.pipe(map((bands) => [...bands].sort((a, b) => (a.created_at > b.created_at ? 1 : -1))));
  // this.titles$ = item.pipe(map(objs => objs.map(c => c.title).sort((a, b) => a.localCompare(b))))
  // tap((results) => {
  //   return results.sort((x, y) => (x.created_at < y.created_at ? -1 : 1)); // https://stackoverflow.com/a/50276301
  // })
  // .pipe(
  //   map((data) => {
  //     debugger;
  //     if (!this.pubkey) {
  //       return;
  //     }
  //     return data.filter((n) => n.pubkey == this.pubkey);
  //   })
  // );

  subscriptions: Subscription[] = [];

  profileSubscription?: Subscription;

  feedSubscription?: Subscription;

  style?: string;

  isFollowing?: boolean;

  constructor(
    public navigation: NavigationService,
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private queueService: QueueService,
    public options: OptionsService,
    public profiles: ProfileService,
    private dataService: DataService,
    public ui: UIService,
    private validator: DataValidation,
    public circleService: CircleService,
    private storage: StorageService,
    private utilities: Utilities,
    public notesService: NotesService,
    private router: Router,
    private ngZone: NgZone,
    private metricService: MetricService
  ) {
    this.subscriptions.push(
      this.ui.profile$.subscribe(async (profile) => {
        if (!profile) {
          return;
        }

        // this.appState.updateTitle(this.utilities.getShortenedIdentifier(profile.pubkey));
        this.appState.updateTitle(this.utilities.getProfileTitle(this.ui.profile!));
        this.imagePath = this.ui.profile!.picture || '/assets/profile.png';
        this.circle = await this.circleService.get(this.ui.profile!.circle);

        if (this.style) {
          this.layout = Number(this.style);
        } else {
          if (this.circle) {
            this.layout = this.circle!.style;
          } else {
            this.layout = 1;
          }
        }

        this.isFollowing = this.profiles.isFollowing(profile.pubkey);

        // Only store metrics for profiles we're following.
        if (this.isFollowing) {
          this.metricService.increase(1, this.ui.profile!.pubkey);
        }

        // TODO: Increase this, made low during development.
        const timeAgo = moment().subtract(5, 'minutes').unix();

        // If following is nothing and it's been a while since we retrieved the profile,
        // go grab the contacts list.
        if (!this.ui.profile!.following || (this.ui.profile!.retrieved && this.ui.profile!.retrieved < timeAgo)) {
          // Perform NIP-05 validation if older than X or has changed since last time.
          // Get list of relays and following.
          this.queueService.enqueContacts(profile.pubkey);
          // this.downloadFollowingAndRelays(profile);
        }

        // Get the latest version of this profile.
        this.queueService.enqueProfile(profile.pubkey);

        if (this.previousPubKey != profile.pubkey) {
          setTimeout(() => {
            const element2 = document.getElementById('profile-image-anchor');
            element2!.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            this.previousPubKey = profile.pubkey;
          }, 50);
        }

        // Hook up the show more subscription fairly late in the loading process to allow events to load before it.
        this.subscriptions.push(
          this.navigation.showMore$.subscribe(() => {
            this.showMore();
          })
        );
      })
    );
  }

  previousPubKey?: string;

  async follow() {
    this.ui.profile!.status = ProfileStatus.Follow;
    await this.profiles.follow(this.ui.pubkey);
    // this.profile!.status = ProfileStatus.Follow;
    // this.feedService.downloadRecent([this.pubkey!]);
  }

  tabIndex?: number;

  onTabChanged(event: MatTabChangeEvent) {
    // Reset the events count when changing tabs.
    this.router.navigate([], { queryParams: { t: event.index }, replaceUrl: true });

    // this.eventsCount = 5;
    this.#changed();
  }

  #changed() {
    // this.#eventsChanged.next(this.events);
  }

  pageSize = 5;

  static regexpImage = /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|webp))/g;

  parseToImage(event: NostrEventDocument) {
    const images = [...event.content.matchAll(UserComponent.regexpImage)];
    return images.map((i) => i[0]);
  }

  showMore() {
    if (this.tabIndex == null || Number(this.tabIndex) == 0) {
      this.ui.updateRootEventsView(0, this.ui.viewCounts.rootEventsViewCount + this.pageSize);
    } else {
      this.ui.updateReplyEventsView(0, this.ui.viewCounts.replyEventsViewCount + this.pageSize);
    }

    // const count = this.ui.viewEvents.length;
    // const newItems = this.ui.events.slice(count, count + this.pageSize);
    // this.ui.viewEvents.push(...newItems);
    // this.#changed();
    // console.log('All events:', this.ui.events);
    // console.log('Show more!!', this.ui.viewEvents);
  }

  layout?: number = 1;

  // following: string[] = [];

  // downloadFollowingAndRelays(profile: NostrProfileDocument) {
  //   this.dataService.downloadNewestContactsEvents([profile.pubkey]).subscribe((event) => {
  //     const nostrEvent = event as NostrEventDocument;
  //     const publicKeys = nostrEvent.tags.map((t) => t[1]);

  //     // profile.following = publicKeys;
  //     this.profiles.following(profile.pubkey, publicKeys);
  //     // this.following = publicKeys;
  //     // for (let i = 0; i < publicKeys.length; i++) {
  //     //   const publicKey = publicKeys[i];
  //     // }
  //   });
  // }

  ngOnInit() {
    this.appState.showBackButton = true;
    this.appState.actions = [];
    this.appState.updateTitle('');

    // this.ui.clearViewPositions();

    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe(async (params) => {
        this.tabIndex = params['t'];
        this.style = params['s'];
      })
    );

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pubkey: any = params.get('id');
        this.ui.setPubKey(pubkey);

        if (pubkey.startsWith('npub')) {
          const convertedId = this.utilities.convertFromBech32ToHex(pubkey);
          this.router.navigate(['/p', convertedId]);
          return;
        }

        this.appState.updateTitle(this.utilities.getShortenedIdentifier(pubkey));

        // First load 50 events from the persistent storage and then get latest 100 items.
        // const events = await this.storage.storage.getEventsByPubKey(pubkey, 50);
        // this.ui.putEvents(events);
      })
    );
  }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    // this.events = this.validator.filterEvents(this.events);
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

  ngOnDestroy() {
    // Reset the profile selection.
    this.ui.setPubKey(undefined);

    this.utilities.unsubscribe(this.subscriptions);

    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }

    if (this.feedSubscription) {
      this.feedSubscription.unsubscribe();
    }
  }
}
