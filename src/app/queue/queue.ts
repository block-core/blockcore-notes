import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate';
import { OptionsService } from '../services/options';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.html',
  styleUrls: ['./queue.css'],
})
export class QueueComponent {
  constructor(private appState: ApplicationState, public optionsService: OptionsService) {}

  ngOnInit() {
    this.appState.updateTitle('Media Queue');

  }
}
