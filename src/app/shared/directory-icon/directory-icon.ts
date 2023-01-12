import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-directory-icon',
  templateUrl: './directory-icon.html',
})
export class DirectoryIconComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;

  verifications?: string[];

  constructor(private profiles: ProfileService) {}

  async ngOnInit() {
    if (!this.profile) {
      this.profile = await this.profiles.getLocalProfile(this.pubkey);
    }

    if (!this.profile) {
      return;
    }

    this.verifications = this.profile.verifications;
  }
}
