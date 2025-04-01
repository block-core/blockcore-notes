import { Component, Input } from '@angular/core';
import { NotificationModel } from '../../services/interfaces';
import { ProfileNameComponent } from '../profile-name/profile-name';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification-label',
  templateUrl: './notification-label.html',
  imports: [ProfileNameComponent, CommonModule, RouterModule], 
})
export class NotificationLabelComponent {
  @Input() notification: NotificationModel | any;
}
