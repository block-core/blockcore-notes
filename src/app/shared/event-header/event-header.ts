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
    standalone: false
})
export class EventHeaderComponent implements OnChanges {
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

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {}

  async ngOnInit() {}

  async updateProfileDetails() {
    if (!this.profile) {
      return;
    }

    if (this.profile.picture) {
      this.imagePath = this.profile.picture;
    }

    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;

    this.profileName = this.profile.display_name || this.profile.name || this.profileName;

    this.circle = await this.circleService.get(this.profile.circle);
  }
}
