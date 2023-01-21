import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
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
import { dexieToRx } from '../shared/utilities';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-feed-private',
  templateUrl: './feed-private.html',
  styleUrls: ['./feed-private.css'],
})
export class FeedPrivateComponent {
  private get table() {
    return this.db.events;
  }

  publicKey?: string | null;
  offset = 0;
  pageSize = 12;
  currentItems: NostrEventDocument[] = [];

  currentItems$ = dexieToRx(liveQuery(() => this.table.orderBy('created_at').offset(this.offset).limit(this.pageSize).toArray()));

  items$ = dexieToRx(liveQuery(() => this.items())).pipe(
    map((data) => {
      data.sort((a, b) => {
        return a.created_at < b.created_at ? 1 : -1;
      });

      return data;
    })
  );

  async items() {
    return this.table.toArray();
  }

  constructor(
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

  async showMore() {
    const items = await this.table.orderBy('created_at').reverse().offset(this.offset).limit(this.pageSize).toArray();
    this.currentItems.push(...items);

    // Half the page size after initial load.
    if (this.offset === 0) {
      this.pageSize = Math.floor(this.pageSize / 2);
    }

    this.offset += this.pageSize;
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

  async ngOnInit() {
    this.appState.updateTitle('Following Notes');
    this.options.values.privateFeed = true;

    this.subscriptions.push(
      this.navigation.showMore$.subscribe(() => {
        this.showMore();
      })
    );
  }
}
