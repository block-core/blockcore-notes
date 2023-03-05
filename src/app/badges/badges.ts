import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { BadgeService } from '../services/badge';
import { QueueService } from '../services/queue.service';
import { Subscription } from 'rxjs';
import { Utilities } from '../services/utilities';
import { RelayService } from '../services/relay';
import { Sub } from 'nostr-tools';
import { EventService } from '../services/event';

@Component({
  selector: 'app-badges',
  templateUrl: 'badges.html',
  styleUrls: ['badges.css'],
})
export class BadgesComponent implements OnInit {
  tabIndex?: number;

  subscriptions: Subscription[] = [];
  receivedBadgesSub: any;
  profileBadgesSub: any;
  badgeDefinitionsSub: any;

  constructor(
    private relayService: RelayService,
    private activatedRoute: ActivatedRoute,
    private utilities: Utilities,
    private router: Router,
    private eventService: EventService,
    public appState: ApplicationState,
    public badgeService: BadgeService,
    public queueService: QueueService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.appState.updateTitle('Badges');
    this.appState.showBackButton = true;
    this.appState.actions = [
      {
        icon: 'note_add',
        tooltip: 'Create new badge type',
        click: () => {
          this.createBadgeType();
        },
      },
      {
        icon: 'assignment_ind',
        tooltip: 'Assign badge to user',
        click: () => {
          this.assignBadge();
        },
      },
    ];

    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe(async (params) => {
        this.tabIndex = params['t'];
      })
    );

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const id: string | null = params.get('id');

        if (id) {
          this.pubkey = id;
          // this.queueService.enque(this.pubkey, 'BadgeDefinition');
          this.receivedBadgesSub = this.relayService.download([{ kinds: [8], ['#p']: [this.pubkey] }], undefined, 'Event');
          this.profileBadgesSub = this.relayService.download([{ kinds: [30008], authors: [this.pubkey], ['#d']: ['profile_badges'] }], undefined, 'Replaceable');
          this.badgeDefinitionsSub = this.relayService.download([{ kinds: [30009], authors: [this.pubkey] }], undefined, 'Replaceable');

          this.cd.detectChanges();
        }

        // this.sub = this.relayService.download([{ kinds: [30009], authors: [pubkey], ['#d']: [identifier] }], undefined, 'Replaceable');
        //   this.queueService.enque(this.appState.getPublicKey(), 'BadgeDefinition');

        //   // Only trigger the event event ID if it's different than the navigation ID.
        //   if (this.navigation.currentEvent?.id != id) {
        //     debugger;
        //     // this.ui.setEventId(id);
        //     // this.thread.changeSelectedEvent(id);
        //   }
      })
    );
  }

  get profileBadges() {
    if (!this.profileBadgesSub || this.profileBadgesSub.events.length == 0) {
      return [];
    }

    const profileBadgesEvent = this.profileBadgesSub.events[0];
    const badges = this.eventService.tagsOfTypeValues(profileBadgesEvent, 'a');

    return badges;
  }

  getId(event: any) {
    return this.eventService.firstATag(event);
  }

  pubkey = '';

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);

    if (this.receivedBadgesSub) {
      this.relayService.unsubscribe(this.receivedBadgesSub.id);
    }

    if (this.profileBadgesSub) {
      this.relayService.unsubscribe(this.profileBadgesSub.id);
    }

    if (this.badgeDefinitionsSub) {
      this.relayService.unsubscribe(this.badgeDefinitionsSub.id);
    }
  }

  onTabChanged(event: MatTabChangeEvent) {
    // Reset the events count when changing tabs.
    this.router.navigate([], { queryParams: { t: event.index }, replaceUrl: true });
  }

  edit(badge: any) {
    this.badgeService.selectedBadge = badge;
    this.router.navigateByUrl('/editor/badges');
  }

  issue(badge: any) {
    this.badgeService.selectedBadge = badge;
    this.router.navigateByUrl('/editor/badges');
  }

  private createBadgeType() {}

  private assignBadge() {}
}
