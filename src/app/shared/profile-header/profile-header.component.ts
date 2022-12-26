import { Component, Input, ViewChild } from '@angular/core';
import { CirclesService } from 'src/app/services/circles.service';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { Circle, NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.css'],
})
export class ProfileHeaderComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;

  constructor(private profiles: ProfileService, private circleService: CirclesService, private utilities: Utilities) {}

  ngAfterViewInit() {}

  async ngOnInit() {
    if (!this.profile) {
      this.profile = await this.profiles.getProfile(this.pubkey);
      this.profileName = this.utilities.getNostrIdentifier(this.pubkey);

      if (!this.profile) {
        return;
      }
    } else {
      this.profileName = this.utilities.getNostrIdentifier(this.profile.pubkey);
    }

    if (this.profile.picture) {
      this.imagePath = this.profile.picture;
    }

    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;
    this.profileName = this.profile.name;

    this.circle = await this.circleService.getCircle(this.profile.circle);
  }
}
