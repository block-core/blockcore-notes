import { Component, Input } from '@angular/core';
import { CircleService } from 'src/app/services/circle';
import { OptionsService } from 'src/app/services/options';
import { ProfileService } from 'src/app/services/profile';
import { ThreadService } from 'src/app/services/thread';
import { UIService } from 'src/app/services/ui';
import { Utilities } from 'src/app/services/utilities';
import { Circle, NostrEventDocument, ThreadEntry } from '../../services/interfaces';

@Component({
  selector: 'app-event-thread',
  templateUrl: './event-thread.html',
  styleUrls: ['./event-thread.css'],
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
