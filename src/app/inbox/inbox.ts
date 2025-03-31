import { Component, signal, effect } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { DataValidation } from '../services/data-validation';
import { OptionsService } from '../services/options';
import { UIService } from '../services/ui';
import { ProfileService } from '../services/profile';
import { NavigationService } from '../services/navigation';
import { NostrEvent, NostrEventDocument } from '../services/interfaces';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { EventComponent } from '../shared/event/event';

@Component({
    selector: 'app-inbox',
    templateUrl: './inbox.html',
    styleUrls: ['./inbox.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      MatButtonModule,
      MatProgressSpinnerModule,
      MatTabsModule,
      EventComponent
    ]
})
export class InboxComponent {
  items = signal<NostrEventDocument[]>([]);
  loading = signal<boolean>(true);
  pageSize = signal<number>(25);
  displayedItems = signal<NostrEventDocument[]>([]);

  constructor(
    private appState: ApplicationState,
    private validator: DataValidation,
    public options: OptionsService,
    public ui: UIService,
    public profile: ProfileService,
    public navigation: NavigationService
  ) {
    // Create an effect to update displayed items when source items change
    effect(() => {
      const allItems = this.items();
      const currentPageSize = this.pageSize();
      this.displayedItems.set(allItems.slice(0, currentPageSize));
    });
  }

  async ngOnInit() {
    this.appState.updateTitle('Inbox');
    this.appState.showBackButton = false;
    
    try {
      // Fetch mentions and other inbox items
      const mentionEvents = await this.fetchMentions();
      this.items.set(mentionEvents);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchMentions(): Promise<NostrEventDocument[]> {
    // Implementation to get mentions
    return [];
  }

  showMore() {
    const currentSize = this.pageSize();
    this.pageSize.set(currentSize + 25);
  }

  trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }
}
