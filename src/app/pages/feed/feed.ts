import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Relay, Event } from 'nostr-tools';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ApplicationState } from '../../services/applicationstate';
import { Utilities } from '../../services/utilities';
import { DataValidation } from '../../services/data-validation';
import { NostrEvent, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { ProfileService } from '../../services/profile';
import { OptionsService } from '../../services/options';
import { AuthenticationService } from '../../services/authentication';
import { NavigationService } from '../../services/navigation';
import { FeedPrivateComponent } from 'src/app/components/feed-private/feed-private';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatSnackBarModule, MatTabsModule, MatIconModule, FeedPrivateComponent],
  templateUrl: './feed.html',
})
export class FeedComponent {
  publicKey?: string | null;

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
  ) {
    
  }

  ngAfterViewInit() {
    
  }

  ngAfterContentInit() {
    
  }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    this.events = this.validator.filterEvents(this.events);
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  events: NostrEvent[] = [];
  sub: any;
  relay?: Relay;
  initialLoad = true;

  details = false;

  toggleDetails() {
    this.details = !this.details;
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.close();
    }
  }

  feedChanged($event: any, type: string) {
    if (type === 'public') {
      // If user choose public and set the value to values, we'll turn on the private.
      if (!this.options.values.publicFeed) {
        this.options.values.privateFeed = true;
      } else {
        this.options.values.privateFeed = false;
      }
    } else {
      // If user choose private and set the value to values, we'll turn on the public.
      if (!this.options.values.privateFeed) {
        this.options.values.publicFeed = true;
      } else {
        this.options.values.publicFeed = false;
      }
    }
  }

  async ngOnInit() {
    this.options.values.privateFeed = true;

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc

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
}
