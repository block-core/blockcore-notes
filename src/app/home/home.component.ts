import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay, Event } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { SettingsService } from '../services/settings.service';
import { NotesService } from '../services/notes.service';
import { map, Observable, shareReplay, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from '../shared/create-note-dialog/create-note-dialog';
import { OptionsService } from '../services/options.service';
import { FeedService } from '../services/feed.service';
import { AuthenticationService } from '../services/authentication.service';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
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
    private feedService: FeedService,
    private ngZone: NgZone
  ) {
    console.log('HOME constructor!!'); // Hm.. called twice, why?
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
  }

  ngAfterContentInit() {
    console.log('ngAfterContentInit');
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

  fetchProfiles(relay: Relay, authors: string[]) {
    // const filteredAuthors = authors.filter((a) => {
    //   return this.profile.profiles[a] == null;
    // });
    // console.log('authors:', authors);
    // console.log('filteredAuthors:', filteredAuthors);
    // if (filteredAuthors.length === 0) {
    //   return;
    // }
    // const profileSub = relay.sub([{ kinds: [0], authors: authors }], {});
    // profileSub.on('event', async (originalEvent: NostrEvent) => {
    //   const event = this.processEvent(originalEvent);
    //   if (!event) {
    //     return;
    //   }
    //   // const parsed = this.validator.sanitizeProfile(event);
    //   // const test1 = JSON.parse('{"name":"stat","picture":"https://i.imgur.com/s1scsdH_d.webp?maxwidth=640&amp;shape=thumb&amp;fidelity=medium","about":"senior software engineer at amazon\\n\\n#bitcoin","nip05":"stat@no.str.cr"}');
    //   // console.log('WHAT IS WRONG WITH THIS??');
    //   // console.log(test1);
    //   try {
    //     const profile = this.validator.sanitizeProfile(JSON.parse(event.content) as NostrProfileDocument) as NostrProfileDocument;
    //     // Persist the profile.
    //     await this.profile.putProfile(event.pubkey, profile);
    //     const displayName = encodeURIComponent(profile.name);
    //     const url = `https://www.nostr.directory/.well-known/nostr.json?name=${displayName}`;
    //     const rawResponse = await fetch(url, {
    //       method: 'GET',
    //       mode: 'cors',
    //     });
    //     if (rawResponse.status === 200) {
    //       const content = await rawResponse.json();
    //       const directoryPublicKey = content.names[displayName];
    //       if (event.pubkey === directoryPublicKey) {
    //         if (!profile.verifications) {
    //           profile.verifications = [];
    //         }
    //         profile.verifications.push('@nostr.directory');
    //         // Update the profile with verification data.
    //         await this.profile.putProfile(event.pubkey, profile);
    //       } else {
    //         // profile.verified = false;
    //         console.warn('Nickname reuse:', url);
    //       }
    //     } else {
    //       // profile.verified = false;
    //     }
    //   } catch (err) {
    //     console.warn('This profile event was not parsed due to errors:', event);
    //   }
    // });
    // profileSub.on('eose', () => {
    //   profileSub.unsub();
    // });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }
  }

  feedChanged($event: any, type: string) {
    if (type === 'public') {
      // If user choose public and set the value to values, we'll turn on the private.
      if (!this.options.options.publicFeed) {
        this.options.options.privateFeed = true;
      } else {
        this.options.options.privateFeed = false;
      }
    } else {
      // If user choose private and set the value to values, we'll turn on the public.
      if (!this.options.options.privateFeed) {
        this.options.options.publicFeed = true;
      } else {
        this.options.options.publicFeed = false;
      }
    }
  }

  // async optionsUpdated($event: any, type: any) {
  //   if (type == 1) {
  //     this.showCached = false;
  //   } else {
  //     this.showBlocked = false;
  //   }

  //   await this.load();
  // }

  async ngOnInit() {
    this.options.options.privateFeed = true;

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc

    this.appState.title = '';
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
