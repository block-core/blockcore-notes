import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { ChatService } from 'src/app/services/chat.service';

interface ChatModel {
  id: string;
  name: string;
}

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
})
export class ChatListComponent implements OnInit {
  @Output() openChatSidebar: EventEmitter<string> = new EventEmitter();

  constructor(public chatService: ChatService) {}

  ngOnInit() {
    this.chatService.download();

    // this.chatService.uniqueChats$.subscribe((data) => {
    //   console.log('YEEH!', data);
    // });
  }

  add() {
    // this.#chats.unshift({ id: '123', name: 'Yes!' });
  }

  reset() {
    // this.#chats = [];
  }
}
