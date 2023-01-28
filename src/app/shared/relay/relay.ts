import { Component } from '@angular/core';
import { NostrRelayDocument } from 'src/app/services/interfaces';
import { OptionsService } from 'src/app/services/options';
import { RelayService } from 'src/app/services/relay';

@Component({
  selector: 'app-relay',
  templateUrl: './relay.html',
  styleUrls: ['./relay.css'],
  inputs: ['relay'],
})
export class RelayComponent {
  relay!: NostrRelayDocument;

  typesOfShoes: string[] = ['Disabled', 'Clogs', 'Loafers', 'Moccasins', 'Sneakers'];

  typesOfRelays: any[] = [
    {
      type: 'Read and Write',
      description: 'Reads and writes events, profiles and other metadata. Always connected.',
    },
    {
      type: 'Write metadata',
      description: 'Writes your profile and other metadata updates. Connects on-demand.',
    },
    {
      type: 'Disabled',
      description: 'Disables this relay until activated again.',
    },
  ];

  typesOfPrivacy: any[] = [
    {
      type: 'Public',
      description: 'This relay is included in your public relay list.',
    },
    {
      type: 'Private',
      description: 'This relay is not published as part of your public relay list.',
    },
  ];

  constructor(public optionsService: OptionsService, private relayService: RelayService) {}

  ngOnInit() {}

  async onRelayChanged(relay: NostrRelayDocument) {
    // if (relay.enabled && relay.read) {
    //   await relay.connect();
    // } else if (!relay.read) {
    //   await relay.close();
    // } else {
    //   await relay.close();
    // }
    // await this.relayService.putRelayMetadata(relay.metadata);
  }

  async primaryRelay(relay: NostrRelayDocument) {
    this.optionsService.values.primaryRelay = relay.url;
    this.optionsService.save();
  }

  async deleteRelay(relay: NostrRelayDocument) {
    await this.relayService.deleteRelay2(relay.url);
  }
}
