import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { relayInit, Relay, Event, getEventHash, Kind } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { DataService } from '../services/data';
import { UIService } from '../services/ui';
import { NavigationService } from '../services/navigation';
import { UploadService } from '../services/upload';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.html',
  styleUrls: ['profile.css'],
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
    private upload: UploadService,
    public navigation: NavigationService,
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

  selectedProfileFile: any = null;
  selectedBannerFile: any = null;

  onProfileFileSelected(event: any): void {
    if (!this.profile) {
      return;
    }

    this.selectedProfileFile = event.target.files[0] ?? null;
    const url = (window.URL ? URL : webkitURL).createObjectURL(this.selectedProfileFile);
    this.profile.picture = this.sanitizer.bypassSecurityTrustUrl(url);
  }

  onBannerFileSelected(event: any): void {
    if (!this.profile) {
      return;
    }

    this.selectedBannerFile = event.target.files[0] ?? null;
    const url = (window.URL ? URL : webkitURL).createObjectURL(this.selectedBannerFile);
    this.profile.banner = this.sanitizer.bypassSecurityTrustUrl(url);
  }

  cloneProfile() {
    // const profileClone = JSON.stringify(this.originalProfile);
    const profileClone = structuredClone(this.originalProfile);

    // this.profile = JSON.parse(profileClone);
    //this.profile = Object.assign({}, JSON.parse(profileClone));
    this.profile = profileClone;

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
    if (this.profile?.picture != this.originalProfile?.picture) {
      console.log('Upload profile image...');

      const uploadResult = await this.upload.upload(this.selectedProfileFile);
      console.log(uploadResult);

      if (uploadResult.url) {
        this.profile!.picture = uploadResult.url;
      }
    }

    if (this.profile?.banner != this.originalProfile?.banner) {
      console.log('Upload banner image...');

      const uploadResult = await this.upload.upload(this.selectedBannerFile);
      console.log(uploadResult);

      if (uploadResult.url) {
        this.profile!.banner = uploadResult.url;
      }
    }

    console.log(this.profile);

    await this.dataService.updateMetadata(this.profile!);

    this.router.navigate(['/p', this.profile?.pubkey]);
    // this.appState.navigateBack();
  }
}
