import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NostrRelayDocument } from 'src/app/services/interfaces';
import { LoggerService } from 'src/app/services/logger';
import { OptionsService } from 'src/app/services/options';
import { RelayService } from 'src/app/services/relay';

@Component({
  selector: 'app-relay',
  templateUrl: './relay.html',
  styleUrls: ['./relay.css'],
  inputs: ['relay'],
  imports: [MatExpansionModule, MatButtonModule, CommonModule, MatIconModule, RouterModule, TranslateModule, MatCardModule, MatListModule],
})
export class RelayComponent {
  relay!: NostrRelayDocument;

  logger = inject(LoggerService);
  //   relayType = 1;
  //   relayPrivacy = 0;

  selectedRelayType: any;
  selectedRelayPublic: any;

  typesOfRelays: any[] = [
    {
      type: 1,
      title: 'Read and Write',
      description: 'Reads and writes events, profiles and other metadata. Always connected.',
      icon: 'edit_note',
    },
    {
      type: 2,
      title: 'Read',
      description: 'Reads only, does not write, unless explicit specified on publish action.',
      icon: 'edit_off',
    },
    {
      type: 3,
      title: 'Write',
      description: 'Writes your events, profile and other metadata updates. Connects on-demand.',
      icon: 'edit',
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

  constructor(public optionsService: OptionsService, private relayService: RelayService) {}

  ngOnInit() {}

  async onRelayTypeChange(change: MatSelectionListChange) {
    this.logger.info('onRelayTypeChange', change.options[0].value);
    this.relay.type = change.options[0].value;
    this.logger.info('Saving', this.relay);
    await this.relayService.setRelayType(this.relay.url, this.relay.type);

    if (!this.relay.enabled || this.relay.type > 2) {
      this.relayService.terminate(this.relay.url);
    } else {
      this.relayService.createRelayWorker(this.relay.url);
    }
  }

  async onRelayPublicChange(change: MatSelectionListChange) {
    this.logger.info('onRelayPublicChange', change.options[0].value);
    this.relay.public = change.options[0].value;

    this.logger.info('SAVING:', this.relay);
    await this.relayService.setRelayPublic(this.relay.url, this.relay.public);
  }

  async onRelayStatusChange(change: MatSelectionListChange) {
    this.logger.info('onRelayStatusChange', change.options[0].value);
    this.relay.enabled = change.options[0].value;

    this.logger.info('SAVING:', this.relay);
    await this.relayService.setRelayEnabled(this.relay.url, this.relay.enabled);

    if (this.relay.enabled || this.relay.type > 2) {
      this.relayService.createRelayWorker(this.relay.url);
    } else {
      this.relayService.terminate(this.relay.url);
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

  async primaryRelay(relay: NostrRelayDocument) {
    this.optionsService.values.primaryRelay = relay.url;
    this.optionsService.save();
  }

  async deleteRelay(relay: NostrRelayDocument) {
    await this.relayService.deleteRelay(relay.url);
  }

  relayFavIcon(url: string) {
    const favUrl = url.replace('wss://', 'https://');
    return favUrl + '/favicon.ico';
  }
}
