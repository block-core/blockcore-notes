import { Component } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { NostrRelayDocument } from "src/app/services/interfaces";
import { RelayComponent } from "../relay/relay";

@Component({
    selector: 'app-relays',
    templateUrl: './relays.html',
    styleUrls: ['./relays.css'],
    inputs: ['relays'],
    imports: [MatExpansionModule, RelayComponent],
})
export class RelaysComponent {
    relays?: NostrRelayDocument[];

    constructor() { }

    ngOnInit() { }

    public trackByFn(index: number, item: NostrRelayDocument) {
        return `${item.url}${item.modified}`;
    }
}