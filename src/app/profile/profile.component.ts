import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate.service';
import { Utilities } from '../services/utilities.service';
import { relayInit, Relay, Event } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation.service';
import { NostrEvent, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeedService } from '../services/feed.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  pubkey?: string;
  npub!: string;
  profile?: NostrProfileDocument;
  about?: string;
  imagePath = '';
  profileName = '';
  loading!: boolean;

  subscriptions: Subscription[] = [];

  constructor(public appState: ApplicationState,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    public profiles: ProfileService,
    private sanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private feedService: FeedService,

  ) {

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pubkey: any = params.get('id');

        if (!pubkey) {
          return;
        }

        this.pubkey = pubkey;
        this.profile = await this.profiles.getProfile(pubkey);

        if (!this.profile) {
          this.npub = this.utilities.getNostrIdentifier(pubkey);
          this.profileName = this.utilities.getShortenedIdentifier(pubkey);
          this.imagePath = 'https://notes.blockcore.net/assets/profile.png';

          // If the user has name in their profile, show that and not pubkey.

          this.appState.title = `@${this.npub}`;
        } else {
          this.npub = this.utilities.getNostrIdentifier(pubkey);
          this.profileName = this.profile.name;

          if (!this.profile.display_name) {
            this.profile.display_name = this.profileName;
          }

          this.imagePath = this.profile.picture || 'https://notes.blockcore.net/assets/profile.png';

          // If the user has name in their profile, show that and not pubkey.
          this.appState.title = `@${this.profile.name}`;
        }
      })
    );
  }

  async ngOnInit() { }

  sanitize(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustUrl(url);
    return clean;
  }

   async updateMetadata() {
    //"{name: <string>, about: <string>, picture: <url, string>}",
    const content = `"{name:"${this.profileName}", about: "${this.about}", picture:"${this.imagePath}"}"`;
   
    let event: Event = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      content: content,
      pubkey: this.appState.getPublicKey(),
      tags: [],
    };

    //await this.feedService.publish(event);
  }


}

