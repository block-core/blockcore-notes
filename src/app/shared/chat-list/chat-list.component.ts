import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatService } from 'src/app/services/chat.service';
import { ChatModel } from 'src/app/services/interfaces';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
})
export class ChatListComponent implements OnInit {
  @Output() openChatSidebar: EventEmitter<string> = new EventEmitter();
  chats$: Observable<ChatModel[]>;

  constructor(private service: ChatService) {
    this.chats$ = service.chats.asObservable();
  }

  ngOnInit() {
    this.service.getChats();
  }
}
