import { Component, Input, ViewChild } from '@angular/core';
import { CircleService } from 'src/app/services/circle.service';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { Circle, NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-event-header',
  templateUrl: './event-header.component.html',
  styleUrls: ['./event-header.component.css'],
})
export class EventHeaderComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;

  constructor(private profiles: ProfileService, private circleService: CircleService, private utilities: Utilities) {}

  ngAfterViewInit() {}

  async ngOnInit() {
    if (!this.profile) {
      this.profileName = this.utilities.getNostrIdentifier(this.pubkey);

      this.profiles.getProfile(this.pubkey).subscribe(async (profile) => {
        this.profile = profile;
        await this.updateProfileDetails();
      });
      // this.profile = await this.profiles.getLocalProfile(this.pubkey);
    } else {
      this.pubkey = this.profile.pubkey;
      // this.profileName = this.utilities.getNostrIdentifier(this.profile.pubkey);
      await this.updateProfileDetails();
    }
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
