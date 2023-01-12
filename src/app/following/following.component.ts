import { ChangeDetectorRef, Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApplicationState } from '../services/applicationstate.service';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowingComponent {
  pubkey?: string;

  subscriptions: Subscription[] = [];

  pubkeys?: string[] = [];

  constructor(private appState: ApplicationState, public profileService: ProfileService, private activatedRoute: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.appState.showBackButton = true;

    this.subscriptions.push(
      this.profileService.item$.subscribe((profile) => {
        this.appState.title = `@${profile?.name}`;

        this.pubkeys = profile?.following;
      })
    );

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pubkey: any = params.get('id');
        this.pubkey = pubkey;
        this.profileService.setItemByPubKey(pubkey);
        this.appState.backUrl = '/p/' + this.pubkey;
      })
    );
  }

  ngOnDestroy() {
    for (let i = 0; i < this.subscriptions.length; i++) {
      this.subscriptions[i].unsubscribe();
    }
  }
}
