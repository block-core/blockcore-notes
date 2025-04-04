import { Component, inject } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { NostrRelayDocument } from "src/app/services/interfaces";
import { RelayComponent } from "../relay/relay";
import { MatButtonModule } from "@angular/material/button";
import { Relay2Service } from "src/app/services/relay2";
import { CommonModule } from "@angular/common";
import { Relay2Component } from "../relay2/relay";

@Component({
    selector: 'app-relays',
    templateUrl: './relays.html',
    styleUrls: ['./relays.css'],
    inputs: ['relays'],
    imports: [CommonModule, MatExpansionModule, MatButtonModule, RelayComponent, Relay2Component],
})
export class RelaysComponent {
    relays?: NostrRelayDocument[];

    relayService = inject(Relay2Service);

    constructor() { }

    ngOnInit() { }

    public trackByFn(index: number, item: NostrRelayDocument) {
        return `${item.url}${item.modified}`;
    }
}