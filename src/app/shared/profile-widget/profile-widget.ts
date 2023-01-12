import { Component, Input } from '@angular/core';
import { ProfileService } from 'src/app/services/profile';
import { Utilities } from 'src/app/services/utilities';
import { NostrProfile } from '../../services/interfaces';

@Component({
  selector: 'app-profile-widget',
  templateUrl: './profile-widget.html',
  styleUrls: ['./profile-widget.css'],
})
export class ProfileWidgetComponent {
  @Input() pubkey: string = '';

  profileName = '';
  tooltip = '';

  constructor(private profiles: ProfileService, private utilities: Utilities) {}

  ngOnInit() {}
}
