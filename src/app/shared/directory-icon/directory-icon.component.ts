import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile.service';
import { NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-directory-icon',
  templateUrl: './directory-icon.component.html',
})
export class DirectoryIconComponent {
  @Input() publicKey: string = '';

  verified = false;

  verifications?: string[];

  constructor(private profiles: ProfileService) {}

  ngOnInit() {
    const profile = this.profiles.profiles[this.publicKey] as NostrProfileDocument;

    if (!profile || !profile.name) {
      return;
    }

    if (!profile.verifications) {
      this.verifications = profile.verifications;
    }
  }
}
