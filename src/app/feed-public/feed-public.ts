import { ChangeDetectorRef, Component, NgZone, signal, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { Relay } from 'nostr-tools';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { NotesService } from '../services/notes';
import { map, Observable, shareReplay } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OptionsService } from '../services/options';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EventComponent } from '../shared/event/event';

@Component({
    selector: 'app-feed-public',
    templateUrl: './feed-public.html',
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
      EventComponent
    ]
})
export class FeedPublicComponent {
  publicKey = signal<string | null | undefined>(undefined);
  events = signal<NostrEvent[]>([]);
  details = signal<boolean>(false);

  constructor(
    public appState: ApplicationState,
    public options: OptionsService,
    private notesService: NotesService,
    public profile: ProfileService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  optionsUpdated() {
    // Parse existing content.
    this.events.update(events => this.validator.filterEvents(events));
  }

  activeOptions() {
    let options = '';

    if (this.options.values.hideSpam) {
      options += ' Spam: Filtered';
    } else {
      options += ' Spam: Allowed';
    }

    if (this.options.values.hideInvoice) {
      options += ' Invoices: Hidden';
    } else {
      options += ' Invoices: Displayed';
    }

    return options;
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  async follow(pubkey: string, circle?: number) {
    await this.profile.follow(pubkey, circle);
  }

  toggleDetails() {
    this.details.update(value => !value);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }

    if (this.relay) {
      this.relay.close();
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

  isHandset$: Observable<boolean> = this.breakpointObserver.observe('(max-width: 599px)').pipe(
    map((result) => result.matches),
    shareReplay()
  );

  async ngOnInit() {
    this.options.values.privateFeed = true;

    this.appState.updateTitle('');

    if (this.relay) {
      return;
    }

    this.relay = await Relay.connect('wss://nostr-pub.wellorder.net');
  }
  
  sub: any;
  relay?: Relay;
  initialLoad = true;
}
