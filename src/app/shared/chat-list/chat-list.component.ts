import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { ChatService } from 'src/app/services/chat.service';
import { ChatItemComponent } from '../chat-item/chat-item.component';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

interface ChatModel {
  id: string;
  name: string;
}

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
  imports: [ChatItemComponent, MatIconModule, MatFormFieldModule, MatInputModule, MatListModule, RouterModule, CommonModule],
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
