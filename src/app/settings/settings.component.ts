import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  constructor(private appState: ApplicationState) {
    appState.showBackButton = true;
    appState.title = 'Settings';
  }
}
