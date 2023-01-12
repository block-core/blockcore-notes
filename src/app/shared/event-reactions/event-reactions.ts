import { Component, Input } from '@angular/core';
import { OptionsService } from 'src/app/services/options';
import { ThreadService } from 'src/app/services/thread';
import { Circle, ThreadEntry } from '../../services/interfaces';

@Component({
  selector: 'app-event-reactions',
  templateUrl: './event-reactions.html',
  styleUrls: ['./event-reactions.css'],
})
export class EventReactionsComponent {
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
