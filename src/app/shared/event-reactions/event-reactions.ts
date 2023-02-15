import { Component, Input } from '@angular/core';
import { OptionsService } from 'src/app/services/options';
import { ThreadService } from 'src/app/services/thread';
import { Circle, NostrEventDocument, ThreadEntry } from '../../services/interfaces';

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

  constructor(public thread: ThreadService, public optionsService: OptionsService) {}

  ngAfterViewInit() {}

  async ngOnInit() {
    if (this.event?.id) {
      this.threadEntry = this.thread.getTreeEntry(this.event.id);
      console.log('THREAD ENTRY:', this.threadEntry);
    }
  }
}
