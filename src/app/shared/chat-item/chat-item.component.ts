import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';
import { ChatModel, NostrEventDocument } from 'src/app/services/interfaces';

@Component({
  selector: 'app-chat-item',
  templateUrl: './chat-item.component.html',
  styleUrls: ['./chat-item.component.scss'],
})
export class ChatItemComponent {
  @Output() openChatSidebar: EventEmitter<string> = new EventEmitter();
  @Input() chat!: ChatModel;
  @Input() event!: NostrEventDocument;

  constructor(private service: ChatService) {}

  showMessageDetail() {
    this.openChatSidebar.emit(this.chat.username);
    // this.service.chat.next(this.chat);
  }
}
