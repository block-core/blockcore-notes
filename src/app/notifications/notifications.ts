import { Component, ChangeDetectorRef } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { UIService } from '../services/ui';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class NotificationsComponent {
  constructor(private ui: UIService, private appState: ApplicationState) {}

  ngOnInit() {
    this.appState.updateTitle('Notifications');
    this.appState.showBackButton = false;
  }
}
