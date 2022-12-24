import { Component, Input, ViewChild } from '@angular/core';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
})
export class ProfileHeaderComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;
  // @Input() profile: any = null;

  // TODO: Add support for using a template for the
  // @ViewChild() ul: HTMLElement;

  imagePath = '/assets/profile.jpg';
  tooltip = '';
  tooltipName = '';
  profileName = '';

  constructor(private profiles: ProfileService, private utilities: Utilities) {}

  // @ViewChild(PupComponent) pup!: PupComponent;

  ngAfterViewInit() {
    // console.log(this.pup.whoAmI()); // I am a pup component!
  }

  async ngOnInit() {
    this.profileName = this.utilities.getNostrIdentifier(this.pubkey);

    if (!this.profile) {
      this.profile = await this.profiles.getProfile(this.pubkey);
    }

    if (!this.profile) {
      return;
    }

    this.imagePath = this.profile.picture;
    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;
    this.profileName = this.profile.name;
  }
}
