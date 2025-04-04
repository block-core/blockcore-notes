import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrProfile, NostrProfileDocument } from '../../services/interfaces';
import { EventHeaderComponent } from '../event-header/event-header';
import { ProfileActionsComponent } from '../profile-actions/profile-actions';

@Component({
  selector: 'app-profile-widget',
  templateUrl: './profile-widget.html',
  styleUrls: ['./profile-widget.css'],
  imports: [EventHeaderComponent, ProfileActionsComponent],
})
export class ProfileWidgetComponent {
  @Input() pubkey: string = '';

  profileName = '';
  tooltip = '';
  profile!: NostrProfileDocument;

  constructor(private profiles: ProfileService, private utilities: Utilities) {}

  async ngOnInit() {
    if(this.pubkey){
      this.profile = await this.profiles.getProfile(this.pubkey)
    }
  }
}
