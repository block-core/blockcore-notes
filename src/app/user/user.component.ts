import { ChangeDetectorRef, Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { Circle, NostrEvent, NostrEventDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { SettingsService } from '../services/settings.service';
import { FeedService } from '../services/feed.service';
import { OptionsService } from '../services/options.service';
import { NavigationService } from '../services/navigation.service';
import { CirclesService } from '../services/circles.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { map, Subscription } from 'rxjs';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
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
  muted? = false;
  initialLoad = true;

  userEvents$ = this.feedService.rootEvents$.pipe(
    map((data) => {
      if (!this.pubkey) {
        return;
      }

      return data.filter((n) => n.pubkey == this.pubkey);
    })
  );

  replyEvents$ = this.feedService.replyEvents$.pipe(
    map((data) => {
      if (!this.pubkey) {
        return;
      }

      return data.filter((n) => n.pubkey == this.pubkey);
    })
  );

  subscriptions: Subscription[] = [];

  constructor(
    private sanitizer: DomSanitizer,
    public navigation: NavigationService,
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public feedService: FeedService,
    public profiles: ProfileService,
    private validator: DataValidation,
    private circleService: CirclesService,
    private utilities: Utilities,
    private router: Router
  ) {
    // this.appState.title = 'Blockcore Notes';
    this.appState.showBackButton = true;

    console.log('USER CONSTRUCTOR RUN!');

    // this.subscriptions.push(
    //   this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
    //     console.log('ROUTING EVENT:', event);
    //     console.log('ROUTING EVENT:', this.router);
    //   })
    // );

    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe(async (params) => {
        const tabIndex = params['t'];
        this.tabIndex = tabIndex;
      })
    );

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pubkey: any = params.get('id');

        if (!pubkey) {
          return;
        }

        this.pubkey = pubkey;
        this.profile = await this.profiles.getProfile(pubkey);

        if (!this.profile) {
          this.npub = this.utilities.getNostrIdentifier(pubkey);
          this.profileName = this.utilities.getShortenedIdentifier(pubkey);
          this.imagePath = '/assets/profile.png';

          // If the user has name in their profile, show that and not pubkey.
          this.circle = undefined;
          this.muted = false;
          this.appState.title = `@${this.npub}`;
        } else {
          this.npub = this.utilities.getNostrIdentifier(pubkey);
          this.profileName = this.profile.name;

          if (!this.profile.display_name) {
            this.profile.display_name = this.profileName;
          }

          this.imagePath = this.profile.picture || '/assets/profile.png';

          // If the user has name in their profile, show that and not pubkey.
          this.circle = await this.circleService.getCircle(this.profile.circle);
          this.muted = this.profile.mute;
          this.appState.title = `@${this.profile.name}`;
        }
      })
    );
  }

  async follow() {
    this.profile!.follow = true;
    await this.profiles.follow(this.pubkey!);
    await this.feedService.downloadRecent([this.pubkey!]);
  }

  sanitize(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustUrl(url);
    return clean;
  }

  tabIndex?: number;

  onTabChanged(event: MatTabChangeEvent) {
    this.router.navigate([], { queryParams: { t: event.index }, replaceUrl: true });
  }

  ngOnInit() {
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
  }
}
