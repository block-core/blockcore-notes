import { Component, Input } from '@angular/core';
import { ThreadService } from 'src/app/services/thread.service';
import { Circle, ThreadEntry } from '../../services/interfaces';

@Component({
  selector: 'app-event-reactions',
  templateUrl: './event-reactions.component.html',
  styleUrls: ['./event-reactions.component.css'],
})
export class EventReactionsComponent {
  @Input() threadEntry?: ThreadEntry | undefined;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;

  constructor(public thread: ThreadService) {}

  ngAfterViewInit() {}

  async ngOnInit() {}
}
