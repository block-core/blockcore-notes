import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { BadgeService } from '../services/badge';
import { QueueService } from '../services/queue.service';
import { Subscription } from 'rxjs';
import { Utilities } from '../services/utilities';

@Component({
  selector: 'app-badges',
  templateUrl: 'badges.html',
  styleUrls: ['badges.css'],
})
export class BadgesComponent implements OnInit {
  tabIndex?: number;

  subscriptions: Subscription[] = [];

  constructor(private activatedRoute: ActivatedRoute, private utilities: Utilities, private router: Router, public appState: ApplicationState, public badgeService: BadgeService, public queueService: QueueService) {}

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

    this.queueService.enque(this.appState.getPublicKey(), 'BadgeDefinition');
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  onTabChanged(event: MatTabChangeEvent) {
    // Reset the events count when changing tabs.
    this.router.navigate([], { queryParams: { t: event.index }, replaceUrl: true });
  }

  edit(badge: any) {
    this.badgeService.selectedBadge = badge;
    this.router.navigateByUrl('/editor/badges');
  }

  private createBadgeType() {}

  private assignBadge() {}
}
