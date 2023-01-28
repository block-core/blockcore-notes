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

  async onRelayTypeChange(model: any) {
    console.log('onRelayTypeChange');
    if (model.length > 0) {
      this.relay.type = model[0];
      console.log('SAVING:', this.relay);
      await this.relayService.setRelayType(this.relay.url, this.relay.type);
    }

    console.log(this.relay);
  }

  async onRelayPublicChange(model: any) {
    console.log('onRelayPublicChange');
    if (model.length > 0) {
      this.relay.public = model[0];
      console.log('SAVING:', this.relay);
      await this.relayService.setRelayPublic(this.relay.url, this.relay.public);
    }

    console.log(this.relay);
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
