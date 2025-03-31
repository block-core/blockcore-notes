import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChange } from '@angular/core';
import { UIService } from '../../services/ui';
import { QueueService } from '../../services/queue.service';
import { ProfileService } from '../../services/profile';
import { CircleService } from '../../services/circle';
import { Utilities } from '../../services/utilities';
import { Circle, NostrProfileDocument } from '../../services/interfaces';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfileNameComponent } from '../profile-name/profile-name';
import { ProfileImageComponent } from '../profile-image/profile-image';
import { DirectoryIconComponent } from '../directory-icon/directory-icon';
import { DateComponent } from '../date/date';

@Component({
    selector: 'app-event-header',
    templateUrl: './event-header.html',
    styleUrls: ['./event-header.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      RouterModule,
      MatTooltipModule,
      ProfileNameComponent,
      ProfileImageComponent,
      DirectoryIconComponent,
      DateComponent
    ]
})
export class EventHeaderComponent implements OnChanges, OnDestroy, OnInit {
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
