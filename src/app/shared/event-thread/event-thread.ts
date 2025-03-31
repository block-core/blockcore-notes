import { Component, Input } from '@angular/core';
import { CircleService } from 'src/app/services/circle';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { ThreadService } from 'src/app/services/thread';
import { UIService } from 'src/app/services/ui';
import { Utilities } from 'src/app/services/utilities';
import { Circle, NostrEventDocument, ThreadEntry } from '../../services/interfaces';
import { EventHeaderComponent } from '../event-header/event-header';
import { EventActionsComponent } from '../event-actions/event-actions';
import { ContentComponent } from '../content/content';
import { EventReactionsComponent } from '../event-reactions/event-reactions';
import { EventButtonsComponent } from '../event-buttons/event-buttons';
import { DateComponent } from '../date/date';
import { CommonModule } from '@angular/common';
import { DirectoryIconComponent } from '../directory-icon/directory-icon';

@Component({
  selector: 'app-event-thread',
  templateUrl: './event-thread.html',
  styleUrls: ['./event-thread.css'],
  imports: [EventHeaderComponent, EventActionsComponent, ContentComponent,
    EventReactionsComponent, EventButtonsComponent, DateComponent, CommonModule, DirectoryIconComponent
  ],
})
export class EventThreadComponent {
  @Input() event?: NostrEventDocument | undefined;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;

  constructor(public ui: UIService, public thread: ThreadService, public optionsService: OptionsService) {}

  ngAfterViewInit() {}

  async ngOnInit() {}
}
