import { ChangeDetectorRef, Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApplicationState } from '../services/applicationstate';
import { DataService } from '../services/data';
import { NostrEventDocument, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { QueueService } from '../services/queue.service';
import { UIService } from '../services/ui';

@Component({
  selector: 'app-following',
  templateUrl: './following.html',
  styleUrls: ['./following.css'],
})
export class FollowingComponent {
  subscriptions: Subscription[] = [];

  constructor(public ui: UIService, private appState: ApplicationState, private dataService: DataService, public profileService: ProfileService, private activatedRoute: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.appState.showBackButton = true;
    this.appState.backUrl = undefined;

    this.subscriptions.push(
      this.ui.profile$.subscribe((profile) => {
        if (!profile) {
          return;
        }

        this.appState.updateTitle(profile.name);
        this.dataService.enque({ type: 'Contacts', identifier: profile.pubkey });
      })
    );

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pubkey: any = params.get('id');
        this.ui.setPubKey(pubkey);

        // if (pubkey) {
        // }

        // this.pubkey = pubkey;
        // this.profileService.setItemByPubKey(pubkey);
        // this.appState.backUrl = '/p/' + pubkey;
      })
    );
  }

  ngOnDestroy() {
    for (let i = 0; i < this.subscriptions.length; i++) {
      this.subscriptions[i].unsubscribe();
    }
  }

  // downloadFollowingAndRelays(profile: NostrProfileDocument) {
  //   this.subscriptions.push(
  //     this.dataService.downloadNewestContactsEvents([profile.pubkey]).subscribe((event) => {
  //       const nostrEvent = event as NostrEventDocument;
  //       const publicKeys = nostrEvent.tags.map((t) => t[1]);

  //       this.profileService.following(profile.pubkey, publicKeys);
  //       this.pubkeys = publicKeys;
  //     })
  //   );
  // }
}
