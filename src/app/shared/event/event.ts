import { Component, Input } from '@angular/core';
import { CircleService } from 'src/app/services/circle';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { ThreadService } from 'src/app/services/thread';
import { UIService } from 'src/app/services/ui';
import { Circle, NostrEventDocument, ThreadEntry } from '../../services/interfaces';
import { CommonModule } from '@angular/common';
import { EventHeaderComponent } from '../event-header/event-header';
import { EventActionsComponent } from '../event-actions/event-actions';
import { EventReactionsComponent } from '../event-reactions/event-reactions';
import { EventButtonsComponent } from '../event-buttons/event-buttons';
import { AgoPipe } from '../ago.pipe';
import { DirectoryIconComponent } from '../directory-icon/directory-icon';
import { ContentComponent } from '../content/content';

@Component({
  selector: 'app-event',
  templateUrl: './event.html',
  styleUrls: ['./event.css'],
  imports: [CommonModule, 
    AgoPipe,
    DirectoryIconComponent,
    ContentComponent,
    EventHeaderComponent, EventActionsComponent, EventReactionsComponent, EventButtonsComponent],
})
export class EventComponent {
  @Input() threadEntry?: ThreadEntry | undefined;
  // @Input() event?: NostrEventDocument | undefined;

  #event?: NostrEventDocument | undefined;

  @Input() set event(value: NostrEventDocument | undefined) {
    this.#event = value;
  }
  get event(): any {
    return this.#event;
  }

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;

  constructor(public ui: UIService, public thread: ThreadService, public optionsService: OptionsService) {}

  ngAfterViewInit() {}

  async ngOnInit() {}
}
