import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrEventDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { SettingsService } from '../services/settings.service';
import { FeedService } from '../services/feed.service';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
})
export class UserComponent {
  pubkey?: string | null;
  profile?: NostrProfileDocument;

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
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public settings: SettingsService,
    public feedService: FeedService,
    public profiles: ProfileService,
    private validator: DataValidation,
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

      if (this.profile) {
        this.appState.title = `@${this.profile.name}`;
      }

      // this.load();
    });
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

    if (this.settings.options.hideSpam) {
      options += ' Spam: Filtered';
    } else {
      options += ' Spam: Allowed';
    }

    if (this.settings.options.hideInvoice) {
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
