import { Component, Input } from '@angular/core';
import { CircleService } from 'src/app/services/circle.service';
import { OptionsService } from 'src/app/services/options.service';
import { ProfileService } from 'src/app/services/profile.service';
import { ThreadService } from 'src/app/services/thread.service';
import { Utilities } from 'src/app/services/utilities.service';
import { Circle, ThreadEntry } from '../../services/interfaces';

@Component({
  selector: 'app-event-thread',
  templateUrl: './event-thread.component.html',
  styleUrls: ['./event-thread.component.css'],
})
export class EventThreadComponent {
  @Input() threadEntry?: ThreadEntry | undefined;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;

  constructor(public thread: ThreadService, public optionsService: OptionsService) {}

  ngAfterViewInit() {}

  async ngOnInit() {}
}
