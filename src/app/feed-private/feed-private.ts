import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { map, Observable, shareReplay, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OptionsService } from '../services/options';
import { NavigationService } from '../services/navigation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../services/storage';
import { UIService } from '../services/ui';
import { CircleService } from '../services/circle';

@Component({
  selector: 'app-feed-private',
  templateUrl: './feed-private.html',
  styleUrls: ['./feed-private.css'],
})
export class FeedPrivateComponent {
  publicKey?: string | null;
  offset = 0;
  pageSize = 12;
  currentItems: NostrEventDocument[] = [];

  // currentItems$ = dexieToRx(liveQuery(() => this.table.orderBy('created_at').offset(this.offset).limit(this.pageSize).toArray()));

  // items$ = dexieToRx(liveQuery(() => this.items())).pipe(
  //   map((data) => {
  //     data.sort((a, b) => {
  //       return a.created_at < b.created_at ? 1 : -1;
  //     });

  //     return data;
  //   })
  // );

  // async items() {
  //   return this.table.toArray();
  // }

  constructor(
    public circleService: CircleService,
    public ui: UIService,
    private activatedRoute: ActivatedRoute,
    public db: StorageService,
    public navigation: NavigationService,
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public profileService: ProfileService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    // console.log('HOME constructor!!'); // Hm.. called twice, why?
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
  }

  ngAfterContentInit() {
    console.log('ngAfterContentInit');
  }

  // cursor: any;
  // finished = false;

  async showMore() {
    this.ui.updateFeedEventsView(0, this.ui.viewCounts.feedEventsViewCount + this.pageSize);

    // 'prev' direction on cursor shows latest on top.
    // let cursor: any = await this.db.storage.db.transaction('events').store.index('created').openCursor(undefined, 'prev');
    // // Proceed to offset.
    // if (this.offset > 0) {
    //   cursor = await cursor?.advance(this.offset);
    // }
    // for (let index = 0; index < this.pageSize; index++) {
    //   if (!cursor) {
    //     break;
    //   }
    //   if (cursor.value && cursor.value.kind == 1) {
    //     this.currentItems.push(cursor.value);
    //   }
    //   if (cursor) {
    //     cursor = await cursor.continue();
    //   }
    // }
    // // Half the page size after initial load.
    // if (this.offset === 0) {
    //   this.pageSize = Math.floor(this.pageSize / 2);
    // }
    // this.offset += this.pageSize;
  }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    // this.events = this.validator.filterEvents(this.events);
  }

  activeOptions() {
    let options = '';

    const peopleCount = this.profileService.following.length;

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

  subscriptions: Subscription[] = [];
  hasFollowers = false;
  circle: number = -1;

  async ngOnInit() {
    this.appState.updateTitle('Feed');
    this.appState.showBackButton = false;
    this.appState.actions = [];
    this.options.values.privateFeed = true;

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const circle: any = params.get('circle');

        this.ui.clearFeed();

        if (circle != null) {
          this.circle = Number(circle);
          this.ui.setFeedCircle(this.circle);
        } else {
          this.circle = -1;
          this.ui.setFeedCircle(this.circle);
        }

        this.subscriptions.push(
          this.navigation.showMore$.subscribe(() => {
            this.showMore();
          })
        );
      })
    );
  }
}
