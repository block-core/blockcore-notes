import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-reply-list',
  templateUrl: './reply-list.html',
  styleUrls: ['./reply-list.css'],
})
export class ReplyListComponent {
  @Input() keys: string[] = [];
  profiles: NostrProfileDocument[] = [];

  constructor(private profileService: ProfileService, private utilities: Utilities) {}

  async ngOnInit() {
    this.profiles = [];

    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];

      // Key was at one time "0" so ensure we skip empties.
      if (key == null || key === '0') {
        continue;
      }

      this.profileService.getProfile(key).subscribe((p) => {
        this.profiles.push(p);
      });

      // if (!profile) {
      //   profile = {
      //     pubkey: key,
      //     name: this.utilities.getShortenedIdentifier(key),
      //   } as NostrProfileDocument;
      // }

      // this.profiles.push(profile);
    }
  }
}
