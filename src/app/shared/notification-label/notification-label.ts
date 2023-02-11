import { Component, Input } from '@angular/core';
import { NotificationModel } from '../../services/interfaces';

@Component({
  selector: 'app-notification-label',
  templateUrl: './notification-label.html',
})
export class NotificationLabelComponent {
  @Input() notification: NotificationModel | any;
}
