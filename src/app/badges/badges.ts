import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { BadgeService } from '../services/badge';
import { QueueService } from '../services/queue.service';

@Component({
  selector: 'app-badges',
  templateUrl: 'badges.html',
  styleUrls: ['badges.css'],
})
export class BadgesComponent implements OnInit {
  constructor(private router: Router, public appState: ApplicationState, public badgeService: BadgeService, public queueService: QueueService) {}

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

  edit(badge: any) {
    this.badgeService.selectedBadge = badge;
    this.router.navigateByUrl('/editor/badges');
  }

  private createBadgeType() {}

  private assignBadge() {}
}
