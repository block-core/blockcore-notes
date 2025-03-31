import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrEventDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { OptionsService } from '../services/options';
import { ThreadService } from '../services/thread';
import { NavigationService } from '../services/navigation';
import { UIService } from '../services/ui';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { EventComponent } from '../shared/event/event';
import { EventThreadComponent } from '../shared/event-thread/event-thread';

@Component({
    selector: 'app-note',
    templateUrl: './note.html',
    styleUrls: ['./note.css'],
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatCardModule,
      EventComponent,
      EventThreadComponent
    ]
})
export class NoteComponent {
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

  likes(event: NostrEventDocument) {
    // let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    // eventsWithSingleeTag = eventsWithSingleeTag.filter((e) => {
    //   const eTag = e.tags.find((p) => p[0] === 'e');
    //   const eTagValue = eTag![1];
    //   return eTagValue != '-';
    // });
    // return eventsWithSingleeTag.length;
  }

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

  ngOnInit() {
    console.log('CURRENT EVENT:', this.navigation.currentEvent);

    this.ui.setPubKey(undefined, false);

    this.ui.clearViewPositions();

    if (this.navigation.currentEvent) {
      this.ui.setEvent(this.navigation.currentEvent);
    }

    this.appState.updateTitle('Thread');
    this.appState.showBackButton = true;

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const id: string | null = params.get('id');

      if (!id) {
        this.router.navigateByUrl('/');
        return;
      }

      if (id.startsWith('note')) {
        const convertedId = this.utilities.convertFromBech32ToHex(id);
        this.router.navigate(['/e', convertedId]);
        return;
      }

      if (this.navigation.currentEvent?.id != id) {
        this.ui.setEventId(id);
      }
    });
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

    this.ui.clear();
  }
}
