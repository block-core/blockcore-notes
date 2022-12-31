import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrEventDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { SettingsService } from '../services/settings.service';
import { FeedService } from '../services/feed.service';
import { map, Observable } from 'rxjs';
import { OptionsService } from '../services/options.service';
import { ThreadService } from '../services/thread.service';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css'],
})
export class NoteComponent {
  id?: string | null;
  event?: NostrEventDocument;

  // userEvents$ = this.feedService.replyEvents$.pipe(
  //   map((data) => {
  //     return data.filter((events) => {
  //       events.tags

  //       const eTag = events.tags.find((t) => t[0] === 'e');

  //       if (eTag[1] == this.id) {
  //         return ;
  //       }

  //       console.log(eTag[1]);
  //     });

  //     // data.filter((events) => events.tags.find((t) => t[0] === 'e')

  //     // return data.filter((events) => events.tags.find((t) => t[0] === 'e'));
  //     // return data;
  //   })
  // );

  // replyEvents$ = this.feedService.events$.pipe(
  //   map((data) => {
  //     if (!this.pubkey) {
  //       return;
  //     }

  //     return data.filter((n) => n.pubkey == this.pubkey);
  //   })
  // );

  constructor(
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public feedService: FeedService,
    public profiles: ProfileService,
    public thread: ThreadService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router
  ) {
    console.log('CONSTRUCTOR FOR NOTE!!!');
  }

  // TODO: Nasty code, just fix it, quick hack before bed.
  likes(event: NostrEventDocument) {
    let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);

    eventsWithSingleeTag = eventsWithSingleeTag.filter((e) => {
      const eTag = e.tags.find((p) => p[0] === 'e');
      const eTagValue = eTag![1];
      return eTagValue != '-';
    });

    return eventsWithSingleeTag.length;
  }

  // TODO: Nasty code, just fix it, quick hack before bed.
  dislikes(event: NostrEventDocument) {
    let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);

    eventsWithSingleeTag = eventsWithSingleeTag.filter((e) => {
      const eTag = e.tags.find((p) => p[0] === 'e');
      const eTagValue = eTag![1];
      return eTagValue == '-';
    });

    return eventsWithSingleeTag.length;
  }

  replies(event: NostrEventDocument) {
    const eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind != 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    return eventsWithSingleeTag.length;
  }

  filteredThread() {
    return this.feedService.thread.filter((p) => p.kind != 7);
  }

  repliesTo(event: NostrEventDocument) {
    if (!event) {
      return;
    }

    let tags = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
    tags = tags.filter((t) => t !== event.pubkey);

    return tags;
  }

  parentEvent?: NostrEventDocument;

  /** Returns the root event, first looks for "root" attribute on the e tag element or picks first in array. */
  rootEvent() {
    if (!this.event) {
      return;
    }

    // TODO. All of this parsing of arrays is silly and could be greatly improved with some refactoring
    // whenever I have time for it.
    const eTags = this.event.tags.filter((t) => t[0] === 'e');

    for (let i = 0; i < eTags.length; i++) {
      const tag = eTags[i];

      // If more than 4, we likely have "root" or "reply"
      if (tag.length > 3) {
        if (tag[3] == 'root') {
          return tag[1];
        }
      }
    }

    return eTags[0][1];
  }

  ngOnInit() {
    console.log('NG INIT ON NOTE:');
    // this.appState.title = 'Blockcore Notes';
    this.appState.showBackButton = true;

    // Subscribe to the event which will update whenever user requests to view a different event.
    // this.feedService.event$(1).subscribe((event) => {
    //   console.log('EVENT CHANGED:', event);

    //   if (!event) {
    //     return;
    //   }

    //   this.event = event;

    //   // Query for root
    //   // Query all child

    //   // Get the root event.
    //   const rootEventId = this.rootEvent();

    //   if (rootEventId) {
    //     // Start downloading the root event.
    //     this.feedService.downloadEvent([rootEventId]);
    //   }

    //   // Clear the initial thread:
    //   this.feedService.thread = [];

    //   // First download all posts, if any, that is mentioned in the e tags.
    //   this.feedService.downloadThread(this.event.id!);
    // });

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const id: any = params.get('id');

      if (!id) {
        this.router.navigateByUrl('/');
        return;
      }

      this.thread.changeSelectedEvent(id);
      this.id = id;

      // console.log('ROUTE ACTIVATE WITH ID:', id);
      // this.feedService.setActiveEvent(id);
      // this.event = this.feedService.events.find((e) => e.id == this.id);

      // if (!this.event) {
      //   // this.router.navigateByUrl('/');
      //   return;
      // }

      // this.appState.title = `Note: ${this.event.content.substring(0, 200)}`;
    });

    // if (this.pubkey) {
    // console.log('PIPING EVENTS...');
    // this.userEvents$ =
    // }
  }

  // openEvent($event: any, event: NostrEventDocument) {
  //   const paths = $event.composedPath();

  //   if (!paths || paths.length == 0) {
  //     return;
  //   }

  //   if (paths[0].className.indexOf('clickable') == -1) {
  //     return;
  //   }

  //   this.router.navigate(['/note', event.id]);
  // }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    // this.events = this.validator.filterEvents(this.events);
  }

  activeOptions() {
    let options = '';

    if (this.options.options.hideSpam) {
      options += ' Spam: Filtered';
    } else {
      options += ' Spam: Allowed';
    }

    if (this.options.options.hideInvoice) {
      options += ' Invoices: Hidden';
    } else {
      options += ' Invoices: Displayed';
    }

    return options;
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  sub: any;
  initialLoad = true;

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }
  }
}
