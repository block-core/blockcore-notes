import { Component, ChangeDetectorRef } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { RelayService } from '../services/relay';
import { UIService } from '../services/ui';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class NotificationsComponent {
  constructor(private relayService: RelayService, private ui: UIService, private appState: ApplicationState) {}

  subscriptionId?: string;

  ngOnInit() {
    this.appState.updateTitle('Notifications');
    this.appState.showBackButton = false;

    // Notifications is a hard-coded subscription identifier.
    this.subscriptionId = this.relayService.subscribe([{ ['#p']: [this.appState.getPublicKey()], limit: 100 }], 'notifications');
  }

  ngOnDestroy() {
    if (this.subscriptionId) {
      this.relayService.unsubscribe(this.subscriptionId);
    }
  }
}
