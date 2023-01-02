import { Component, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { Relay } from 'nostr-tools';
import { ApplicationState } from '../services/applicationstate.service';
import { EventService } from '../services/event.service';
import { FeedService } from '../services/feed.service';
import { ProfileService } from '../services/profile.service';
import { RelayService } from '../services/relay.service';
import { RelayStorageService } from '../services/relay.storage.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  wiped = false;
  wipedNonFollow = false;
  wipedNotes = false;
  open = false;

  constructor(public relayService: RelayService, public relayStorage: RelayStorageService, public feedService: FeedService, public appState: ApplicationState, private storage: StorageService, private profileService: ProfileService) {}

  toggle() {
    if (this.open) {
      this.open = false;
      this.accordion.closeAll();
    } else {
      this.open = true;
      this.accordion.openAll();
    }
  }

  async deleteRelay(relay: Relay) {
    await this.relayService.deleteRelay(relay.url);
  }

  async deleteRelays() {
    await this.relayService.wipe();
  }

  async clearProfileCache() {
    await this.profileService.wipeNonFollow();
    this.wipedNonFollow = true;
  }

  async clearDatabase() {
    await this.storage.wipe();
    this.wiped = true;
    location.reload();
  }

  async clearNotesCache() {
    await this.feedService.wipe();
    this.wipedNotes = true;
  }

  async getDefaultRelays() {
    // Reset all in-memory relay, all subscriptions and wipe the storage.
    // await this.relayService.reset();

    console.log('DEFAULT RELAYS:', this.relayService.defaultRelays);

    // Append the default relays.
    await this.relayService.appendRelays(this.relayService.defaultRelays);

    // Initiate connection to the updated relay list.
    await this.relayService.connect();
  }

  async getRelays() {
    const gt = globalThis as any;
    const relays = await gt.nostr.getRelays();

    // Append the default relays.
    await this.relayService.appendRelays(relays);

    // Initiate connection to the updated relay list.
    await this.relayService.connect();
  }

  ngOnInit() {
    this.appState.title = 'Settings';
    this.appState.showBackButton = true;
    this.appState.actions = [];
  }
}
