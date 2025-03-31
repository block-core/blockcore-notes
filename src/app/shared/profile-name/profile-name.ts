import { Component, Input, OnInit, Signal, inject, signal, computed } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { StorageService } from 'src/app/services/storage';
import { Utilities } from 'src/app/services/utilities';
import { NostrProfile } from '../../services/interfaces';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import {TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-profile-name',
    templateUrl: './profile-name.html',
    standalone: true,
    imports: [CommonModule, MatTooltipModule, TranslateModule, RouterModule, MatTooltipModule]
})
export class ProfileNameComponent implements OnInit {
  @Input() pubkey: string = '';

  private db = inject(StorageService);
  private profiles = inject(ProfileService);
  private utilities = inject(Utilities);

  profileName = signal<string>('');
  tooltip = signal<string>('');

  async ngOnInit() {
    const profile = await this.db.storage.getProfile(this.pubkey);

    if (profile) {
      if (profile.display_name) {
        this.profileName.set(profile.display_name);
      } else {
        this.profileName.set(profile.name);
      }
      
      // Set tooltip to the pubkey for reference
      this.tooltip.set(this.pubkey);
    } else {
      this.profileName.set(this.utilities.getShortenedIdentifier(this.pubkey));
    }
  }
}
