import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile.service';
import { NostrProfile } from '../../services/interfaces';

@Component({
  selector: 'app-directory-icon',
  templateUrl: './directory-icon.component.html',
})
export class DirectoryIconComponent {
  @Input() publicKey: string = '';

  verified = false;

  constructor(private profiles: ProfileService) {}

  ngOnInit() {
    const profile = this.profiles.profiles[this.publicKey] as NostrProfile;

    if (!profile || !profile.name) {
      return;
    }

    if (profile.verified) {
      this.verified = true;
    }
  }
}
