import {Component, Input} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MessageModel } from 'src/app/services/interfaces';


@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  imports: [MatCardModule],
})
export class MessageBubbleComponent {
  @Input() message!: MessageModel;
  @Input() cover!: string;
}
