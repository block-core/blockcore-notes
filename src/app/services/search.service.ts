import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { nip19 } from 'nostr-tools';
import { ApplicationState } from './applicationstate.service';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(public router: Router, public appState: ApplicationState) {}

  search(searchText: string) {
    console.log('Searching for: ', searchText);

    if (searchText.startsWith('npub')) {
      const pubkey = nip19.decode(searchText) as any;
      this.resetSearch();
      this.router.navigate(['/p', pubkey.data]);
    } else if (searchText.startsWith('nevent')) {
      const event = nip19.decode(searchText) as any;
      this.resetSearch();
      this.router.navigate(['/p', event.data]);
    }
  }

  resetSearch() {
    this.appState.searchText = '';
    this.appState.showSearch = false;
  }
}
