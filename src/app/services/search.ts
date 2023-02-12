import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { nip19 } from 'nostr-tools';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationState } from './applicationstate';
import { ProfileService } from './profile';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  results$: Observable<any>;

  resultsChanged: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private router: Router, private appState: ApplicationState, private profileService: ProfileService) {
    this.results$ = this.resultsChanged.asObservable();
  }

  async search(searchText: string) {
    if (!searchText) {
      return;
    }

    console.log('Searching for: ', searchText);

    if (searchText.startsWith('npub')) {
      const pubkey = nip19.decode(searchText) as any;
      this.resetSearch();
      this.router.navigate(['/p', pubkey.data]);
    } else if (searchText.startsWith('nevent')) {
      const event = nip19.decode(searchText) as any;
      this.resetSearch();
      this.router.navigate(['/p', event.data]);
      //} else if (searchText.indexOf('@') > -1) {
      // this.profileService.search(searchText);
      // this.resetSearch();
      // this.router.navigate(['/p', event.data]);
    } else {
      const result: any = await this.profileService.search(searchText.toLowerCase());
      // TODO: Re-enable this sort when search is added again.
      // result.sort((a, b) => (a.status > b.status ? -1 : 1));
      this.updateResults(result);

      // Should we open profile or event? ...
      if (!result) {
        this.resetSearch();
        this.router.navigate(['/p', searchText]);
      }
    }
  }

  filteredOptions?: Observable<string[]>;

  updateResults(results: any) {
    this.resultsChanged.next(results);
  }

  open(selected: any) {
    console.log('SELECTED:', selected);

    if (!selected) {
      return;
    }

    this.resetSearch();
    this.router.navigate(['/p', selected.pubkey]);
  }

  resetSearch() {
    this.appState.searchText = '';
    this.appState.showSearch = false;
  }
}
