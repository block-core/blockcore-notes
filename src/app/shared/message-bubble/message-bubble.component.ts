import {Component, Input} from '@angular/core';
import { MessageModel } from 'src/app/services/interfaces';


@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent {
  @Input() message!: MessageModel;
  @Input() cover!: string;
}
