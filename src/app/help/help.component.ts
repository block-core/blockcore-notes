import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css'],
})
export class HelpComponent {
  constructor(private appState: ApplicationState) {
    appState.showBackButton = true;
    appState.title = 'Help';
  }
}
