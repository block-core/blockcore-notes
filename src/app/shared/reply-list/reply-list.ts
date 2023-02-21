import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';

export interface ReplyEntry {
  pubkey: string;
  name: string;
}

@Component({
  selector: 'app-reply-list',
  templateUrl: 'reply-list.html',
  styleUrls: ['reply-list.css'],
})
export class ReplyListComponent {
  @Input() keys: string[] = [];
  profiles: ReplyEntry[] = [];

  constructor(private profileService: ProfileService, private utilities: Utilities) {}

  async ngOnInit() {
    this.profiles = [];

    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];

      // Key was at one time "0" so ensure we skip empties.
      if (key == null || key === '0') {
        continue;
      }

      const profile = await this.profileService.getProfile(key);

      if (profile) {
        this.profiles.push({ pubkey: profile.pubkey, name: profile.name });
      } else {
        this.profiles.push({ pubkey: key, name: key });
      }
    }
  }
}
