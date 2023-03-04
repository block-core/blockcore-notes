import { Component, Input, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { CircleService } from 'src/app/services/circle';
import { ProfileService } from 'src/app/services/profile';
import { QueueService } from 'src/app/services/queue.service';
import { UIService } from 'src/app/services/ui';
import { Utilities } from 'src/app/services/utilities';
import { Circle, NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-event-header',
  templateUrl: './event-header.html',
  styleUrls: ['./event-header.css'],
})
export class EventHeaderComponent implements OnChanges {
  // @Input() pubkey: string = '';
  // @Input() profile?: NostrProfileDocument;
  @Input() displayName: boolean = true;
  @Input() displayContent: boolean = true;
  @Input() iconSize: string = 'small';
  @Input() listType: string = 'list';

  #profile?: NostrProfileDocument;
  @Input() set profile(value: NostrProfileDocument) {
    this.#profile = value;
    this.#pubkey = value.pubkey;
    this.updateProfileDetails();
  }
  get profile(): any {
    return this.#profile;
  }

  #pubkey: string = '';
  @Input() set pubkey(value: string) {
    this.#pubkey = value;

    this.profiles.getProfile(value).then(async (profile) => {
      this.#profile = profile;
      await this.updateProfileDetails();
    });
  }
  get pubkey() {
    return this.#pubkey;
  }

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;
  subscriptions: Subscription[] = [];

  constructor(private ui: UIService, private queueService: QueueService, private profiles: ProfileService, private circleService: CircleService, private utilities: Utilities) {}

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    // if (changes['input'] && changes['input'].currentValue !== changes['input'].previousValue) {
    //   // this.currentNumber = this.data.someOtherNumber + this.input.numberIneed;
    // }
  }

  async ngOnInit() {
    // if (!this.profile) {
    //   this.profileName = this.utilities.getNostrIdentifier(this.pubkey);
    //   this.profile = await this.profiles.getProfile(this.pubkey);
    //   // this.profile = this.profiles.getCachedProfile(this.pubkey);
    //   // // For performance optimization, we don't want to hit the database on this custom component,
    //   // // but if we can't get profile from cache, we should schedule a download.
    //   // if (!this.profile) {
    //   //   this.subscriptions.push(
    //   //     this.profiles.profilesChanged$.subscribe(() => {
    //   //       if (!this.profile) {
    //   //         this.profile = this.profiles.getCachedProfile(this.pubkey);
    //   //         if (this.profile) {
    //   //           this.utilities.unsubscribe(this.subscriptions);
    //   //         } else {
    //   //           debugger;
    //   //         }
    //   //       }
    //   //     })
    //   //   );
    //   //   this.queueService.enqueProfile(this.pubkey);
    //   // }
    //   // if (!this.profile)
    //   // {
    //   //   this.queueService.enqueProfile(pubkey);
    //   // }
    //   // if (!this.profile) {
    //   //   this.profile = await this.profiles.getProfile(this.pubkey);
    //   // }
    //   await this.updateProfileDetails();
    //   // this.profile = await this.profiles.getLocalProfile(this.pubkey);
    // } else {
    //   this.pubkey = this.profile.pubkey;
    //   // this.profileName = this.utilities.getNostrIdentifier(this.profile.pubkey);
    //   await this.updateProfileDetails();
    // }
  }

  async updateProfileDetails() {
    if (!this.profile) {
      return;
    }

    if (this.profile.picture) {
      this.imagePath = this.profile.picture;
    }

    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;

    // Set profile name to display_name, or name, or re-use existing profilename (should be npub)
    this.profileName = this.profile.display_name || this.profile.name || this.profileName;

    this.circle = await this.circleService.get(this.profile.circle);
  }
}
