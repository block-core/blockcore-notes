import { Component, ChangeDetectorRef } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { RelayService } from '../services/relay';
import { StorageService } from '../services/storage';
import { UIService } from '../services/ui';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class NotificationsComponent {
  constructor(private db: StorageService, private relayService: RelayService, public ui: UIService, private appState: ApplicationState) {}

  subscriptionId?: string;

  async ngOnInit() {
    this.appState.updateTitle('Notifications');
    this.appState.showBackButton = false;

    const notifications = await this.db.storage.getNotifications(100);

    notifications.map((n) => (n.seen = true));

    this.ui.putNotifications(notifications);

    // Notifications is a hard-coded subscription identifier.
    this.subscriptionId = this.relayService.subscribe([{ ['#p']: [this.appState.getPublicKey()], limit: 100 }], 'notifications');
  }

  async ngOnDestroy() {
    if (this.subscriptionId) {
      this.relayService.unsubscribe(this.subscriptionId);
    }

    for (let index = 0; index < this.ui.notifications.length; index++) {
      const notification = this.ui.notifications[index];
      await this.db.storage.putNotification(notification);
    }
  }
}
