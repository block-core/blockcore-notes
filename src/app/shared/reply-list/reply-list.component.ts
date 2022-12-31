import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-reply-list',
  templateUrl: './reply-list.component.html',
  styleUrls: ['./reply-list.component.css']
})
export class ReplyListComponent {
  @Input() keys: string[] = [];

  profileName = '';
  tooltip = '';

  profiles: NostrProfileDocument[] = [];

  constructor(private profileService: ProfileService, private utilities: Utilities) {}

  async ngOnInit() {
    this.profiles = [];

    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];
      let profile = await this.profileService.getProfile(key);

      if (!profile) {
        profile = {
          pubkey: key,
          name: key,
        } as NostrProfileDocument;
      }

      this.profiles.push(profile);
    }

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
