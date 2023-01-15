import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { relayInit, Relay, Event, getEventHash } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { DataService } from '../services/data';
import { UIService } from '../services/ui';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
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

  #profileChanged: BehaviorSubject<NostrProfileDocument | undefined> = new BehaviorSubject<NostrProfileDocument | undefined>(this.profile);

  get profile$(): Observable<NostrProfileDocument | undefined> {
    return this.#profileChanged.asObservable();
  }

  constructor(
    public ui: UIService,
    public appState: ApplicationState,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router,
    public profiles: ProfileService,
    private sanitizer: DomSanitizer,
    private profileService: ProfileService,
    private dataService: DataService,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.appState.updateTitle('Edit Profile');

    this.originalProfile = {
      name: '',
      pubkey: this.appState.getPublicKey(),
    } as NostrProfileDocument;

    this.subscriptions.push(
      this.profileService.profile$.subscribe((profile) => {
        if (!profile) {
          profile = this.profileService.emptyProfile(this.appState.getPublicKey());
        }

        console.log('PROFILE SERVICE:', profile);
        this.originalProfile = profile;

        if (this.originalProfile) {
          this.cloneProfile();
        }
      })
    );
  }

  cloneProfile() {
    const profileClone = JSON.stringify(this.originalProfile);
    // this.profile = JSON.parse(profileClone);
    this.profile = Object.assign({}, JSON.parse(profileClone));

    this.#profileChanged.next(this.profile);

    // Whenever the active user profile is changed, also change the selected profile which is used by profile header.

    this.ui.setProfile(this.profile);
    // this.profileService.setItem(this.profile);
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

    const signedEvent = await this.dataService.signEvent(event);

    // await this.feedService.publish(event, false); // Don't persist this locally.
    this.profile!.created_at = event.created_at;

    // Use the whole document for this update as we don't want to loose additional metadata we have, such
    // as follow (on self).
    await this.profileService.updateProfile(this.profile!.pubkey, this.profile!);

    await this.dataService.publishEvent(signedEvent);

    this.appState.navigateBack();
  }
}
