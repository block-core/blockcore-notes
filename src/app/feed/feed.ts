import { ChangeDetectorRef, Component, NgZone, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { OptionsService } from '../services/options';
import { AuthenticationService } from '../services/authentication';
import { NavigationService } from '../services/navigation';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    selector: 'app-feed',
    templateUrl: './feed.html',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatCardModule,
      MatButtonModule,
      MatSlideToggleModule,
      FormsModule,
      MatIconModule,
      MatToolbarModule
    ]
})
export class FeedComponent {
  publicKey = signal<string | null | undefined>(undefined);
  details = signal<boolean>(false);
  events = signal<NostrEvent[]>([]);

  constructor(
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public dialog: MatDialog,
    public profile: ProfileService,
    private validator: DataValidation,
    public navigationService: NavigationService,
    private authService: AuthenticationService,
    private utilities: Utilities,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private ngZone: NgZone
  ) {}

  optionsUpdated() {
    // Parse existing content.
    this.events.update(events => this.validator.filterEvents(events));
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  toggleDetails() {
    this.details.update(d => !d);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }
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
    this.options.values.privateFeed = true;

    this.appState.updateTitle('');
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'note_add',
        tooltip: 'Create Note',
        click: () => {
          this.navigationService.createNote();
        },
      },
    ];
  }
  
  sub: any;
  relay?: Relay;
  initialLoad = true;
}
