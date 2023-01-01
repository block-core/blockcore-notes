import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay, Event } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { FeedService } from '../services/feed.service';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  pubkey?: string;
  npub!: string;
  profile?: NostrProfileDocument;
  originalProfile?: NostrProfileDocument;
  about?: string;
  imagePath = '';
  profileName = '';
  loading!: boolean;
  subscriptions: Subscription[] = [];

  constructor(
    public appState: ApplicationState,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    public profiles: ProfileService,
    private sanitizer: DomSanitizer,
    private profileService: ProfileService,
    private dataService: DataService,
    private activatedRoute: ActivatedRoute,
    private feedService: FeedService
  ) {}

  async ngOnInit() {
    this.appState.title = 'Edit Profile';

    this.subscriptions.push(
      this.profileService.profile$.subscribe((profile) => {
        this.originalProfile = profile;

        if (this.originalProfile) {
          this.cloneProfile();
        }
      })
    );
  }

  cloneProfile() {
    const profileClone = JSON.stringify(this.originalProfile);
    this.profile = JSON.parse(profileClone);
  }

  cancelEdit() {
    this.cloneProfile();
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  sanitize(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustUrl(url);
    return clean;
  }

  async updateMetadata() {
    const profileContent = this.utilities.reduceProfile(this.profile!);

    let event: Event = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify(profileContent),
      pubkey: this.appState.getPublicKey(),
      tags: [],
    };

    await this.feedService.publish(event, false); // Don't persist this locally.

    this.profile!.created_at = event.created_at;

    // Use the whole document for this update as we don't want to loose additional metadata we have, such
    // as follow (on self).
    await this.profileService.updateProfile(this.profile!.pubkey, this.profile!);

    this.appState.navigateBack();
  }
}
