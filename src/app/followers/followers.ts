import { ChangeDetectorRef, Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { ProfileService } from '../services/profile';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ApplicationState } from '../services/applicationstate';
import { UIService } from '../services/ui';

@Component({
  selector: 'app-followers',
  templateUrl: './followers.html',
  styleUrls: ['./followers.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowersComponent {
  // pubkey?: string;

  subscriptions: Subscription[] = [];

  constructor(public ui: UIService, private appState: ApplicationState, public profileService: ProfileService, private activatedRoute: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.appState.showBackButton = true;
    this.appState.backUrl = undefined;

    this.subscriptions.push(
      this.ui.profile$.subscribe((profile) => {
        this.appState.updateTitle(`@${profile?.name}`);
      })
    );

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pubkey: any = params.get('id');
        this.ui.setPubKey(pubkey);
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
}
