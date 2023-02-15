import { Component, Input } from '@angular/core';
import { OptionsService } from 'src/app/services/options';
import { ThreadService } from 'src/app/services/thread';
import { Circle, NostrEventDocument, ThreadEntry } from '../../services/interfaces';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/services/ui';

@Component({
  selector: 'app-event-reactions',
  templateUrl: './event-reactions.html',
  styleUrls: ['./event-reactions.css'],
})
export class EventReactionsComponent {
  // @Input() threadEntry?: ThreadEntry | undefined;
  @Input() event?: NostrEventDocument | undefined;
  threadEntry?: ThreadEntry;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;
  sub?: Subscription;

  constructor(public thread: ThreadService, public ui: UIService, public optionsService: OptionsService) {}

  ngAfterViewInit() {}

  async ngOnInit() {
    this.sub = this.ui.reactions$.subscribe((id) => {
      if (!this.event) {
        return;
      }

      if (id == this.event.id) {
        this.threadEntry = this.thread.getTreeEntry(this.event.id!);
      }
    });

    this.threadEntry = this.thread.getTreeEntry(this.event?.id!);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
