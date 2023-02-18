import { Pipe, PipeTransform } from '@angular/core';
import { ProfileService } from '../services/profile';
import { Utilities } from '../services/utilities';

@Pipe({ name: 'username' })
export class UsernamePipe implements PipeTransform {
  constructor(private profileService: ProfileService, private utilities: Utilities) {}

  transform(value: string) {
    if (!value) {
      return value;
    }

    const profile = this.profileService.getCachedProfile(value);

    if (!profile) {
      return this.utilities.getShortenedIdentifier(value);
    } else {
      return this.utilities.getProfileDisplayName(profile);
    }
  }
}
