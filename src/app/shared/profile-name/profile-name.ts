import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrProfile } from '../../services/interfaces';

@Component({
  selector: 'app-profile-name',
  templateUrl: './profile-name.html',
})
export class ProfileNameComponent {
  @Input() publicKey: string = '';

  profileName = '';
  tooltip = '';

  constructor(private profiles: ProfileService, private utilities: Utilities) {}

  ngOnInit() {
    // this.profileName = this.utilities.getNostrIdentifier(this.publicKey);
    // const profile = this.profiles.profiles[this.publicKey] as NostrProfile;
    // if (!profile || !profile.name) {
    //   return;
    // }
    // // TODO: Just a basic protection of long urls, temporary.
    // if (profile.name.length > 255) {
    //   return;
    // }
    // this.tooltip = this.profileName; // Only set tooltip if we replace the publicKey with it.
    // this.profileName = profile.name;
  }
}
