import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { NostrProfileDocument } from '../../services/interfaces';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-directory-icon',
  templateUrl: './directory-icon.html',
  imports: [MatIconModule, MatTooltipModule],
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
