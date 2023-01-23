import { Component } from "@angular/core";
import { NostrRelayDocument } from "src/app/services/interfaces";

@Component({
    selector: 'app-relays',
    templateUrl: './relays.html',
    styleUrls: ['./relays.css'],
    inputs: ['relays']
})
export class RelaysComponent {
    relays?: NostrRelayDocument[];

    constructor() { }

    ngOnInit() { }

    public trackByFn(index: number, item: NostrRelayDocument) {
        return `${item.url}${item.modified}`;
    }
}