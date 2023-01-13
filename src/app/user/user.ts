import { ChangeDetectorRef, Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation';
import { Circle, NostrEvent, NostrEventDocument, NostrProfile, NostrProfileDocument, ProfileStatus } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { SettingsService } from '../services/settings';
import { OptionsService } from '../services/options';
import { NavigationService } from '../services/navigation';
import { CircleService } from '../services/circle';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { map, Observable, of, Subscription, tap, BehaviorSubject, finalize } from 'rxjs';
import { DataService } from '../services/data';
import { NotesService } from '../services/notes';
import { QueueService } from '../services/queue';

@Component({
  selector: 'app-user',
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  pubkey?: string | null;
  npub!: string;
  profile?: NostrProfileDocument;
  about?: string;
  imagePath = '/assets/profile.png';
  profileName = '';
  circle?: Circle;
  initialLoad = true;

  events: NostrEventDocument[] = [];
  #eventsChanged: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.events);
  get events$(): Observable<NostrEventDocument[]> {
    return this.#eventsChanged.asObservable().pipe(map((data) => data.sort((a, b) => (a.created_at > b.created_at ? -1 : 1))));
  }

  rootEvents$ = this.events$
    .pipe(
      map((data) => {
        return data.filter((e) => e.tags.filter((p) => p[0] === 'e').length == 0);
      })
    )
    .pipe(map((x) => x.slice(0, this.eventsCount)));

  replyEvents$ = this.events$
    .pipe(
      map((data) => {
        return data.filter((e) => e.tags.filter((p) => p[0] === 'e').length > 0);
      })
    )
    .pipe(map((x) => x.slice(0, this.eventsCount)));

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

  constructor(
    public navigation: NavigationService,
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private queueService: QueueService,
    public options: OptionsService,
    public profiles: ProfileService,
    private dataService: DataService,
    private validator: DataValidation,
    public circleService: CircleService,
    private utilities: Utilities,
    public notesService: NotesService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  async follow() {
    this.profile!.status = ProfileStatus.Follow;
    await this.profiles.follow(this.pubkey!);
    // this.feedService.downloadRecent([this.pubkey!]);
  }

  tabIndex?: number;

  onTabChanged(event: MatTabChangeEvent) {
    // Reset the events count when changing tabs.
    this.router.navigate([], { queryParams: { t: event.index }, replaceUrl: true });

    this.eventsCount = 5;
    this.#changed();
  }

  #changed() {
    this.#eventsChanged.next(this.events);
  }

  eventsCount = 5;

  showMore() {
    this.eventsCount += 5;
    this.#changed();
  }

  layout?: number;

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
    // setInterval(() => {
    //   console.log('Closed:', this.feedSubscription?.closed);
    // }, 50);

    this.subscriptions.push(
      this.navigation.showMore$.subscribe(() => {
        this.showMore();
      })
    );

    this.appState.showBackButton = true;
    this.appState.actions = [];
    this.appState.title = '';

    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe(async (params) => {
        const tabIndex = params['t'];
        this.tabIndex = tabIndex;
      })
    );

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pubkey: any = params.get('id');

        // Whenever the user changes, unsubsribe the profile observable (which normally should be completed, but for safety).
        if (this.profileSubscription) {
          this.profileSubscription.unsubscribe();
        }

        if (this.feedSubscription) {
          this.feedSubscription.unsubscribe();
        }

        if (!pubkey) {
          this.profiles.setItem(undefined);
          return;
        }

        this.pubkey = pubkey;
        this.appState.updateTitle(this.utilities.getShortenedIdentifier(pubkey));

        // Reset the current profile first.
        this.profiles.setItem(undefined);

        this.profileSubscription = this.profiles.getProfile(pubkey).subscribe(async (profile) => {
          this.profiles.setItem(profile);
          this.profile = profile;

          if (!this.profile) {
            this.profile = this.profiles.emptyProfile(pubkey);
            this.circle = undefined;
          }

          // this.npub = this.utilities.getNostrIdentifier(pubkey);

          // if (!this.profile.name) {
          //   this.profile.name = this.npub;
          // }

          // this.profileName = this.profile.name;
          this.appState.updateTitle(this.utilities.getProfileTitle(this.profile));
          this.imagePath = this.profile.picture || '/assets/profile.png';
          this.circle = await this.circleService.get(this.profile.circle);

          debugger;

          if (this.circle) {
            this.layout = this.circle!.style;
          }

          // TODO: Increase this, made low during development.
          const timeAgo = moment().subtract(1, 'minutes').unix();

          if (this.profile.retrieved && this.profile.retrieved < timeAgo) {
            // Perform NIP-05 validation if older than X or has changed since last time.
            // Get list of relays and following.
            this.queueService.enqueContacts(profile.pubkey);
            // this.downloadFollowingAndRelays(profile);
          }
        });

        this.feedSubscription = this.dataService.downloadNewestEventsByQuery([{ kinds: [1], authors: [this.pubkey], limit: 100 }]).subscribe((event) => {
          if (!event) {
            return;
          }

          const existingIndex = this.events.findIndex((e) => e.id == event.id);

          if (existingIndex !== -1) {
            return;
          }

          this.events.unshift(event);
          // this.notesService.currentViewNotes.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
          this.#changed();

          // this.notes = this.notesService.currentViewNotes.slice(0, this.eventsCount);

          // this.ngZone.run(() => {
          //   // this.notesService.currentViewNotes.push(event);
          //   this.notes = this.notesService.currentViewNotes.slice(0, this.eventsCount);
          //   console.log(this.notes);
          // });

          // this.ite
          //   .of(this.notesService.currentViewNotes)
          //   // .pipe(
          //   //   map((data) => {
          //   //     // debugger;
          //   //     return data.sort((a, b) => {
          //   //       debugger;
          //   //       return a.created_at > b.created_at ? 1 : -1;
          //   //     });
          //   //   })
          //   // )
          //   .pipe(map((x) => x.slice(0, this.eventsCount)));

          // x.slice(0, this.eventsCount);

          // this.ngZone.run(() => {
          //   this.notesService.currentViewNotes.push(event);
          // });

          // console.log('LENGTH:', this.notesService.currentViewNotes.length);
        });
      })
    );

    // if (this.pubkey) {
    // console.log('PIPING EVENTS...');
    // this.userEvents$ =
    // }
  }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    // this.events = this.validator.filterEvents(this.events);
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

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);

    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }

    if (this.feedSubscription) {
      this.feedSubscription.unsubscribe();
    }
  }
}
