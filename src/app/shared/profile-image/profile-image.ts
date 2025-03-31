import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { NostrProfile } from '../../services/interfaces';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-profile-image',
    templateUrl: './profile-image.html',
    standalone: true,
    imports: [MatTooltipModule],
})
export class ProfileImageComponent implements OnInit {
  @Input() publicKey: string = '';

  imagePath = signal<string>('/assets/profile.png');
  tooltip = signal<string>('');
  
  private profiles = inject(ProfileService);

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
