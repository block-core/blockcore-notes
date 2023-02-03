import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { MediaItem } from '../services/interfaces';
import { MediaService } from '../services/media';
import { OptionsService } from '../services/options';
import { Utilities } from '../services/utilities';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.html',
  styleUrls: ['./queue.css'],
})
export class QueueComponent {
  constructor(private appState: ApplicationState, public optionsService: OptionsService, public media: MediaService, public utilities: Utilities) {}

  ngOnInit() {
    this.appState.updateTitle('Media Queue');
  }

  remove(item: MediaItem) {
    this.media.dequeue(item);
  }
}
