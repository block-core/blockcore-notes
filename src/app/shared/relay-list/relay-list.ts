import { Component, Input } from '@angular/core';
import { Utilities } from 'src/app/services/utilities';

@Component({
  selector: 'app-relay-list',
  templateUrl: './relay-list.html',
})
export class RelayListComponent {
  @Input() relays: any;
  relayNames: string[] = [];

  constructor(private utilities: Utilities) {}

  async ngOnInit() {
    this.relayNames = [];

    if (this.relays == null) {
      return;
    }

    const relayJson = JSON.parse(this.relays);
    this.relayNames = this.utilities.getRelayUrls(relayJson);
  }
}
