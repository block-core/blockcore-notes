import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { NostrProfile } from '../../services/interfaces';

@Component({
  selector: 'app-profile-image',
  templateUrl: './profile-image.html',
})
export class ProfileImageComponent {
  @Input() publicKey: string = '';

  imagePath = '/assets/profile.png';
  tooltip = '';

  constructor(private profiles: ProfileService) {}

  ngOnInit() {
    // const profile = this.profiles.profiles[this.publicKey] as NostrProfile;

    // if (!profile || !profile.picture) {
    //   return;
    // }

    // // TODO: Just a basic protection of long urls, temporary.
    // if (profile.picture.length > 255) {
    //   return;
    // }

    // this.imagePath = profile.picture;
    // this.tooltip = profile.about;
  }
}
