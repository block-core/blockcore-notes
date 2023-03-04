import { Component, OnInit } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { BadgeService } from '../services/badge';
import { QueueService } from '../services/queue.service';

@Component({
  selector: 'app-badges',
  templateUrl: 'badges.html',
  styleUrls: ['badges.css'],
})
export class BadgesComponent implements OnInit {
  constructor(public appState: ApplicationState, public badgeService: BadgeService, public queueService: QueueService) {}

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

    this.queueService.enque(this.appState.getPublicKey(), 'BadgeDefinition');
  }

  private createBadgeType() {}

  private assignBadge() {}
}
