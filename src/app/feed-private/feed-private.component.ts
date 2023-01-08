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
import { OptionsService } from '../services/options.service';
import { NavigationService } from '../services/navigation.service';
import { ScrollEvent } from '../shared/scroll.directive';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-feed-private',
  templateUrl: './feed-private.component.html',
  styleUrls: ['./feed-private.component.css'],
})
export class FeedPrivateComponent {
  publicKey?: string | null;

  constructor(
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
    console.log('HOME constructor!!'); // Hm.. called twice, why?
  }

  // get eventsView$(): Observable<NostrEventDocument[]> {
  //   return this.feedService.events$.pipe(map((x) => x.slice(0, this.eventsCount)));
  // }

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

    // const followList = await this.profileService.followList();
    // this.hasFollowers = followList.length > 0;

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc
  }
}
