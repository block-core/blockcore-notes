import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NostrRelayDocument, RelayEntry } from 'src/app/services/interfaces';
import { LoggerService } from 'src/app/services/logger';
import { OptionsService } from 'src/app/services/options';
import { RelayService } from 'src/app/services/relay';
import { Relay2Service } from 'src/app/services/relay2';

@Component({
  selector: 'app-relay2',
  templateUrl: './relay.html',
  styleUrls: ['./relay.css'],
  inputs: ['relay'],
  imports: [MatExpansionModule, MatButtonModule, CommonModule, MatIconModule, RouterModule, TranslateModule, MatCardModule, MatListModule],
})
export class Relay2Component {
  relay!: RelayEntry;

  logger = inject(LoggerService);
  //   relayType = 1;
  //   relayPrivacy = 0;

  selectedRelayType: any;
  selectedRelayPublic: any;

  typesOfRelays: any[] = [
    {
      type: 1,
      title: 'Inbox / Outbox',
      description: 'This is where your events are posted. Replies and DMs from others will be delivered here.',
      icon: 'inbox',
    },
    {
      type: 2,
      title: 'Inbox',
      description: 'Your events will not be posted here. Replies and DMs from others will be delivered here.',
      icon: 'archive',
    },
    {
      type: 3,
      title: 'Outbox',
      description: 'This is where your events are posted. Replies and DMs from others will not be delivered here.',
      icon: 'unarchive',
    },
  ];

  typesOfPrivacy: any[] = [
    {
      type: true,
      title: 'Public',
      description: 'This relay is included in your public relay list.',
      icon: 'public',
    },
    {
      type: false,
      title: 'Private',
      description: 'This relay is not published as part of your public relay list.',
      icon: 'public_off',
    },
  ];

  typesOfStatus: any[] = [
    {
      type: true,
      title: 'Enabled',
      description: 'This relay is enabled and Notes will connect to it.',
      icon: 'cloud_done',
    },
    {
      type: false,
      title: 'Disabled',
      description: 'Disables this relay (locally) until activated again.',
      icon: 'cloud_off',
    },
  ];

  relayService = inject(Relay2Service);

  constructor(public optionsService: OptionsService) {}

  ngOnInit() {}

  async onRelayTypeChange(change: MatSelectionListChange) {
    this.logger.info('onRelayTypeChange', change.options[0].value);
    this.relay.data!.type = change.options[0].value;
    this.logger.info('Saving', this.relay);
    await this.relayService.setRelayType(this.relay.url, this.relay.data!.type);

    if (!this.relay.data!.enabled || this.relay.data!.type > 2) {
      // this.relayService.terminate(this.relay.url);
    } else {
      // this.relayService.createRelayWorker(this.relay.url);
    }
  }

  async onRelayPublicChange(change: MatSelectionListChange) {
    this.logger.info('onRelayPublicChange', change.options[0].value);
    this.relay.data!.public = change.options[0].value;

    this.logger.info('SAVING:', this.relay);
    // await this.relayService.setRelayPublic(this.relay.url, this.relay.data!.public);
  }

  async onRelayStatusChange(change: MatSelectionListChange) {
    this.logger.info('onRelayStatusChange', change.options[0].value);
    this.relay.data!.enabled = change.options[0].value;

    this.logger.info('SAVING:', this.relay);
    await this.relayService.setRelayEnabled(this.relay.url, this.relay.data!.enabled);

    if (this.relay.data!.enabled || this.relay.data!.type > 2) {
      // this.relayService.createRelayWorker(this.relay.url);
    } else {
      // this.relayService.terminate(this.relay.url);
    }
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

  async primaryRelay(relay: RelayEntry) {
    this.optionsService.values.primaryRelay = relay.url;
    this.optionsService.save();
  }

  async deleteRelay(relay: RelayEntry) {
    await this.relayService.deleteRelay(relay.url);
  }

  relayFavIcon(url: string) {
    const favUrl = url.replace('wss://', 'https://');
    return favUrl + '/favicon.ico';
  }
}
