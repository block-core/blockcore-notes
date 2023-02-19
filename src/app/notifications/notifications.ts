import { Component, ChangeDetectorRef } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { NavigationService } from '../services/navigation';
import { RelayService } from '../services/relay';
import { StorageService } from '../services/storage';
import { UIService } from '../services/ui';
import { Utilities } from '../services/utilities';
import { map, Observable, shareReplay, Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class NotificationsComponent {
  constructor(public navigation: NavigationService, private utilities: Utilities, private db: StorageService, private relayService: RelayService, public ui: UIService, private appState: ApplicationState) {}

  subscriptionId?: string;
  subscriptions: Subscription[] = [];
  offset = 0;
  pageSize = 12;

  async ngOnInit() {
    this.appState.updateTitle('Notifications');
    this.appState.showBackButton = false;
    this.appState.actions = [];

    const notifications = await this.db.storage.getNotifications(100);
    // notifications.map((n) => (n.seen = true));
    this.ui.putNotifications(notifications);

    this.subscriptions.push(
      this.navigation.showMore$.subscribe(() => {
        this.showMore();
      })
    );
  }

  async showMore() {
    // 'prev' direction on cursor shows latest on top.
    let cursor: any = await this.db.storage.db.transaction('notifications').store.index('created').openCursor(undefined, 'prev');

    // Proceed to offset.
    if (this.offset > 0) {
      cursor = await cursor?.advance(this.offset);
    }

    for (let index = 0; index < this.pageSize; index++) {
      if (!cursor) {
        break;
      }

      if (cursor.value) {
        // Make the notification seen as we've loaded it.
        // cursor.value.seen = true;
        this.ui.putNotification(cursor.value);
        // this.ui.notifications.push(cursor.value);
      }

      if (cursor) {
        cursor = await cursor.continue();
      }
    }

    // Half the page size after initial load.
    if (this.offset === 0) {
      this.pageSize = Math.floor(this.pageSize / 2);
    }

    this.offset += this.pageSize;
  }

  async clearNotifications() {
    await this.db.storage.deleteNotifications();
    this.ui.putNotifications([]);
  }

  async ngOnDestroy() {
    for (let index = 0; index < this.ui.notifications.length; index++) {
      const notification = this.ui.notifications[index];
      notification.seen = true;
      await this.db.storage.putNotification(notification);
    }

    this.ui.triggerUnreadNotifications();

    this.utilities.unsubscribe(this.subscriptions);

    if (this.subscriptionId) {
      this.relayService.unsubscribe(this.subscriptionId);
    }
  }
}
