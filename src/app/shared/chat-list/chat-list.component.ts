import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Kind } from 'nostr-tools';
import { from, Observable, of } from 'rxjs';
import { ChatService } from 'src/app/services/chat.service';
import { RelayService } from 'src/app/services/relay';
import { UIService } from 'src/app/services/ui';

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

  constructor(public chatService: ChatService, public ui: UIService, private relayService: RelayService) {}

  ngOnInit() {
    

    // this.chatService.download();
    // this.chatService.uniqueChats$.subscribe((data) => {
    //   console.log('YEEH!', data);
    // });
  }

  ngOnDestroy() {

  }

  add() {
    // this.#chats.unshift({ id: '123', name: 'Yes!' });
  }

  reset() {
    // this.#chats = [];
  }
}
