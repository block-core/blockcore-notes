import { Component } from '@angular/core';
import { ApplicationState } from './services/applicationstate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(public appState: ApplicationState) {
    appState.title = 'Blockcore Notes';
  }
}
