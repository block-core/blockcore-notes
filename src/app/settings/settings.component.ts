import { Component } from '@angular/core';
import { ApplicationState } from '../services/applicationstate.service';
import { EventService } from '../services/event.service';
import { FeedService } from '../services/feed.service';
import { ProfileService } from '../services/profile.service';
import { RelayService } from '../services/relay.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  wiped = false;
  wipedNonFollow = false;
  wipedNotes = false;

  constructor(public relayService: RelayService, public feedService: FeedService, public appState: ApplicationState, private storage: StorageService, private profileService: ProfileService) {}

  async clearProfileCache() {
    await this.profileService.wipeNonFollow();
    this.wipedNonFollow = true;
  }

  async clearDatabase() {
    await this.storage.wipe();
    this.wiped = true;
  }

  async clearNotesCache() {
    await this.feedService.wipe();
    this.wipedNotes = true;
  }

  async getRelays() {
    const gt = globalThis as any;
    const relays = await gt.nostr.getRelays();
    console.log(relays);

    

    // this.relayService.addRelay( {  });

  }

  ngOnInit() {
    this.appState.title = 'Settings';
    this.appState.showBackButton = true;
    this.appState.actions = [];
  }
}
