import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';
import { ProfileService } from '../services/profile.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  wiped = false;
  wipedNonFollow = false;

  constructor(private appState: ApplicationState, private storage: StorageService, private profileService: ProfileService) {
    appState.showBackButton = true;
    appState.title = 'Settings';
  }

  async clearProfileCache() {
    await this.profileService.wipeNonFollow();
    this.wipedNonFollow = true;
  }

  async clearDatabase() {
    await this.storage.wipe();
    this.wiped = true;
  }
}
