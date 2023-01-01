import { Component, Input, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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
  muted? = false;
  npub!: string;

  constructor(private profiles: ProfileService, private sanitizer: DomSanitizer, private circleService: CirclesService, private utilities: Utilities) {}

  async ngAfterViewInit() {}

  async ngOnInit() {
    if (!this.profile) {
      this.profile = await this.profiles.getProfile(this.pubkey);
      this.npub = this.utilities.getNostrIdentifier(this.pubkey);
      this.profileName = this.npub;

      if (!this.profile) {
        return;
      }
    } else {
      this.pubkey = this.profile.pubkey;
      this.npub = this.utilities.getNostrIdentifier(this.profile.pubkey);
      this.profileName = this.npub;
    }

    if (this.profile.picture) {
      this.imagePath = this.profile.picture;
    }

    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;

    // If the user has name in their profile, show that and not pubkey.
    this.profileName = this.profile.name || this.profileName;

    this.circle = await this.circleService.getCircle(this.profile.circle);

    this.muted = this.profile.mute;
  }

  sanitize(url: string) {
    const clean = this.sanitizer.bypassSecurityTrustUrl(url);
    return clean;
  }
}
