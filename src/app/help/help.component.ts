import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
})
export class HelpComponent {
  constructor(private appState: ApplicationState) {
    appState.showBackButton = true;
    appState.title = 'Help';
  }
}
