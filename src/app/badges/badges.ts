import { Component, OnInit } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';

@Component({
  selector: 'app-badges',
  templateUrl: 'badges.html',
  styleUrls: ['badges.css'],
})
export class BadgesComponent implements OnInit {
  constructor(private appState: ApplicationState) {}

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
  }

  private createBadgeType() {}

  private assignBadge() {}
}
