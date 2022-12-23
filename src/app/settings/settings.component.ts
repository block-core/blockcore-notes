import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {

  wiped = false;

  constructor(private appState: ApplicationState, private storage: StorageService) {
    appState.showBackButton = true;
    appState.title = 'Settings';
  }

  async clearDatabase() {
    await this.storage.wipe();
    this.wiped = true;
  }
}
