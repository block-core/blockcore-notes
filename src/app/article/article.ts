import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrEventDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { OptionsService } from '../services/options';
import { ThreadService } from '../services/thread';
import { NavigationService } from '../services/navigation';
import { UIService } from '../services/ui';
import { Kind, nip19 } from 'nostr-tools';

@Component({
  selector: 'app-article',
  templateUrl: 'article.html',
  styleUrls: ['article.css'],
})
export class ArticleComponent {
  // id?: string | null;
  // event?: NostrEventDocument;

  constructor(
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public optionsService: OptionsService,
    public navigation: NavigationService,
    public profiles: ProfileService,
    public thread: ThreadService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    public ui: UIService
  ) {}

  open(id: string | undefined) {
    this.router.navigate(['/e', id]);
  }

  // TODO: Nasty code, just fix it, quick hack before bed.
  likes(event: NostrEventDocument) {
    // let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    // eventsWithSingleeTag = eventsWithSingleeTag.filter((e) => {
    //   const eTag = e.tags.find((p) => p[0] === 'e');
    //   const eTagValue = eTag![1];
    //   return eTagValue != '-';
    // });
    // return eventsWithSingleeTag.length;
  }

  // TODO: Nasty code, just fix it, quick hack before bed.
  dislikes(event: NostrEventDocument) {
    // let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    // eventsWithSingleeTag = eventsWithSingleeTag.filter((e) => {
    //   const eTag = e.tags.find((p) => p[0] === 'e');
    //   const eTagValue = eTag![1];
    //   return eTagValue == '-';
    // });
    // return eventsWithSingleeTag.length;
  }

  replies(event: NostrEventDocument) {
    // const eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind != 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    // return eventsWithSingleeTag.length;
  }

  filteredThread() {
    // return this.feedService.thread.filter((p) => p.kind != 7);
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
  // rootEvent() {
  //   if (!this.event) {
  //     return;
  //   }

  //   // TODO. All of this parsing of arrays is silly and could be greatly improved with some refactoring
  //   // whenever I have time for it.
  //   const eTags = this.event.tags.filter((t) => t[0] === 'e');

  //   for (let i = 0; i < eTags.length; i++) {
  //     const tag = eTags[i];

  //     // If more than 4, we likely have "root" or "reply"
  //     if (tag.length > 3) {
  //       if (tag[3] == 'root') {
  //         return tag[1];
  //       }
  //     }
  //   }

  //   return eTags[0][1];
  // }

  ngOnInit() {
    console.log('CURRENT EVENT:', this.navigation.currentEvent);

    // Remove the pubkey whenever event is opened, but don't reset state data.
    this.ui.setPubKey(undefined, false);

    this.ui.clearViewPositions();

    // if (this.navigation.currentEvent) {
    //   // If the event is already set, we'll use that directly and not load based upon ID.
    //   this.ui.setEvent(this.navigation.currentEvent);
    // }

    this.appState.updateTitle('Article');
    this.appState.showBackButton = true;

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const id: string | null = params.get('id');

      if (!id) {
        this.router.navigateByUrl('/');
        return;
      }

      if (id.startsWith('naddr')) {
        const result = nip19.decode(id);

        if (result.type == 'naddr') {
          const data = result.data as nip19.AddressPointer;

          if (data.kind == Kind.Article) {
            this.router.navigate(['/a', data.pubkey, data.identifier]);
            return;
          }
        }
      }

      // Only trigger the event event ID if it's different than the navigation ID.
      if (this.navigation.currentEvent?.id != id) {
        this.ui.setEventId(id);
        // this.thread.changeSelectedEvent(id);
      }
    });
  }

  // optionsUpdated() {
  //   // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
  //   // Parse existing content.
  //   // this.events = this.validator.filterEvents(this.events);
  // }

  // activeOptions() {
  //   let options = '';

  //   if (this.options.values.hideSpam) {
  //     options += ' Spam: Filtered';
  //   } else {
  //     options += ' Spam: Allowed';
  //   }

  //   if (this.options.values.hideInvoice) {
  //     options += ' Invoices: Hidden';
  //   } else {
  //     options += ' Invoices: Displayed';
  //   }

  //   return options;
  // }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  sub: any;
  initialLoad = true;

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }

    this.ui.clear();
  }
}
