import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile.service';
import { NostrProfile } from '../../services/interfaces';

@Component({
  selector: 'app-profile-name',
  templateUrl: './profile-name.component.html',
})
export class ProfileNameComponent {
  @Input() publicKey: string = '';

  profileName = '';

  constructor(private profiles: ProfileService) {}

  ngOnInit() {
    this.profileName = this.publicKey;

    const profile = this.profiles.profiles[this.publicKey] as NostrProfile;

    if (!profile || !profile.name) {
      return;
    }

    // TODO: Just a basic protection of long urls, temporary.
    if (profile.name.length > 255) {
      return;
    }

    this.profileName = profile.name;
  }

  //   get class(): string {
  //     // Value will override status.
  //     if (this.value) {
  //       return `network-status-${IndexerApiStatus[this.value].toLowerCase()}`;
  //     } else {
  //       if (!this.status || this.status.length === 0) {
  //         return `network-status-offline`;
  //       } else {
  //         const availableCount = this.status.filter((s) => s.availability == 1).length;
  //         if (availableCount == 0) {
  //           return `network-status-offline`;
  //         } else {
  //           return `network-status-online`;
  //         }
  //       }
  //     }

  //     // if (this.status) {

  //     //     const apiStatus = IndexerApiStatus[this.status.availability].toLowerCase();
  //     //     return `network-status-${apiStatus}`;

  //     // } else {
  //     //     return 'network-status-unknown';
  //     // }
  //   }
}
