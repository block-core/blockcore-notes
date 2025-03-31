import { ChangeDetectorRef, Component, NgZone, signal, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrEventDocument, NostrNoteDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { map, Observable, shareReplay, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OptionsService } from '../services/options';
import { NavigationService } from '../services/navigation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../services/storage';
import { UIService } from '../services/ui';
import { CircleService } from '../services/circle';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EventComponent } from '../shared/event/event';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-feed-private',
    templateUrl: './feed-private.html',
    styleUrls: ['./feed-private.css'],
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatCardModule,
      MatButtonModule,
      MatSlideToggleModule,
      FormsModule,
      MatIconModule,
      MatToolbarModule,
      EventComponent,
      MatProgressSpinnerModule
    ]
})
export class FeedPrivateComponent {
  publicKey = signal<string | null | undefined>(undefined);
  offset = signal<number>(0);
  pageSize = signal<number>(12);
  currentItems = signal<NostrEventDocument[]>([]);
  circle = signal<number>(-1);
  details = signal<boolean>(false);
  hasFollowers = signal<boolean>(false);

  subscriptions: Subscription[] = [];

  constructor(
    public circleService: CircleService,
    public ui: UIService,
    private activatedRoute: ActivatedRoute,
    public db: StorageService,
    public navigation: NavigationService,
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public profileService: ProfileService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    effect(() => {
      const circleValue = this.circle();
      this.ui.setFeedCircle(circleValue);
    });
  }

  async showMore() {
    this.ui.updateFeedEventsView(0, this.ui.viewCounts.feedEventsViewCount + this.pageSize());
  }

  optionsUpdated() {
    // Implementation for options update
  }

  activeOptions() {
    const peopleCount = this.profileService.following.length;
    return '';
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  toggleDetails() {
    this.details.update(value => !value);
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  feedChanged($event: any, type: string) {
    if (type === 'public') {
      if (!this.options.values.publicFeed) {
        this.options.values.privateFeed = true;
      } else {
        this.options.values.privateFeed = false;
      }
    } else {
      if (!this.options.values.privateFeed) {
        this.options.values.publicFeed = true;
      } else {
        this.options.values.publicFeed = false;
      }
    }
  }

  async ngOnInit() {
    this.appState.updateTitle('Feed');
    this.appState.showBackButton = false;
    this.appState.actions = [];
    this.options.values.privateFeed = true;

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const circleParam: any = params.get('circle');

        this.ui.clearFeed();

        if (circleParam != null) {
          this.circle.set(Number(circleParam));
        } else {
          this.circle.set(-1);
        }

        this.subscriptions.push(
          this.navigation.showMore$.subscribe(() => {
            this.showMore();
          })
        );
      })
    );
  }
}
