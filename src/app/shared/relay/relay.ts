import { Component } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
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

  //   relayType = 1;
  //   relayPrivacy = 0;

  selectedRelayType: any;
  selectedRelayPublic: any;

  typesOfRelays: any[] = [
    {
      type: 1,
      title: 'Read and Write',
      description: 'Reads and writes events, profiles and other metadata. Always connected.',
    },
    {
      type: 2,
      title: 'Write metadata',
      description: 'Writes your profile and other metadata updates. Connects on-demand.',
    },
    {
      type: 0,
      title: 'Disabled',
      description: 'Disables this relay until activated again.',
    },
  ];

  typesOfPrivacy: any[] = [
    {
      type: true,
      title: 'Public',
      description: 'This relay is included in your public relay list.',
    },
    {
      type: false,
      title: 'Private',
      description: 'This relay is not published as part of your public relay list.',
    },
  ];

  constructor(public optionsService: OptionsService, private relayService: RelayService) {}

  ngOnInit() {}

  async onRelayTypeChange(change: MatSelectionListChange) {
    console.log('onRelayTypeChange', change.options[0].value);
    this.relay.type = change.options[0].value;
    console.log('SAVING:', this.relay);
    await this.relayService.setRelayType(this.relay.url, this.relay.type);

    if (this.relay.type !== 1) {
      this.relayService.terminate(this.relay.url);
    } else {
      this.relayService.createRelayWorker(this.relay.url);
      
    }
  }

  async onRelayPublicChange(change: MatSelectionListChange) {
    console.log('onRelayPublicChange', change.options[0].value);
    this.relay.public = change.options[0].value;
    console.log('SAVING:', this.relay);
    await this.relayService.setRelayPublic(this.relay.url, this.relay.public);
  }

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
