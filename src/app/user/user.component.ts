import { ChangeDetectorRef, Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { Circle, NostrEvent, NostrEventDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { SettingsService } from '../services/settings.service';
import { FeedService } from '../services/feed.service';
import { map, Observable } from 'rxjs';
import { OptionsService } from '../services/options.service';
import { NavigationService } from '../services/navigation.service';
import { CirclesService } from '../services/circles.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  pubkey?: string | null;
  npub?: string;
  profile?: NostrProfileDocument;
  about?: string;
  imagePath = '/assets/profile.png';
  profileName = '';
  circle?: Circle;
  muted? = false;

  userEvents$ = this.feedService.rootEvents$.pipe(
    map((data) => {
      if (!this.pubkey) {
        return;
      }

      return data.filter((n) => n.pubkey == this.pubkey);
    })
  );

  replyEvents$ = this.feedService.events$.pipe(
    map((data) => {
      if (!this.pubkey) {
        return;
      }

      return data.filter((n) => n.pubkey == this.pubkey);
    })
  );

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

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const pubkey: any = params.get('id');

      if (!pubkey) {
        return;
      }

      this.pubkey = pubkey;
      this.profile = await this.profiles.getProfile(pubkey);

      console.log(this.profile);

      if (!this.profile) {
        this.npub = this.utilities.getNostrIdentifier(pubkey);
        this.profileName = '';
        this.imagePath = '/assets/profile.png';

        // If the user has name in their profile, show that and not pubkey.
        this.circle = undefined;
        this.muted = false;
        this.appState.title = `@${this.npub}`;
      } else {
        this.npub = this.utilities.getNostrIdentifier(pubkey);
        this.profileName = this.profile.name;
        this.imagePath = this.profile.picture || '/assets/profile.png';

        // If the user has name in their profile, show that and not pubkey.
        this.circle = await this.circleService.getCircle(this.profile.circle);
        this.muted = this.profile.mute;
        this.appState.title = `@${this.profile.name}`;
      }
    });
  }

  sanitize(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustUrl(url);
    return clean;
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

  sub: any;
  initialLoad = true;

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }
  }
}
