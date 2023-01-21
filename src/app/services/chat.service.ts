import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatModel, UserModel } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  chats: BehaviorSubject<ChatModel[]> = new BehaviorSubject<ChatModel[]>([]);
  chat: BehaviorSubject<ChatModel> = new BehaviorSubject<ChatModel>(null as any);

  constructor() {}

  saveMessage(chatId: number, message: string) {
    // this.http.saveMessage(chatId, message).then(response => {
    //   let chat = this.chat.value;
    //   response.message = message;
    //   chat.chat.push(response);
    //   this.chat.next(chat);
    // });
  }

  createChat(user: UserModel) {
    // const isHaveChat = this.chats.value.find(chat => chat.targetUserId == user.id);
    // if (!isHaveChat) {
    //   this.http.createChat(0, user.id).then((response) => {
    //     let chats = this.chats.value;
    //     const chat = {
    //       "id": Math.ceil(Math.random() * 100),
    //       "targetUserId": user.id,
    //       "username": user.username,
    //       "cover": user.cover,
    //       "lastMessage": "",
    //       "lastMessageLength": 0,
    //       "chat": []
    //     };
    //     chats.push(chat);
    //     this.chats.next(chats);
    //     this.chat.next(chat);
    //   });
    // } else {
    //   this.chat.next(isHaveChat);
    // }
  }

  getChats() {
    // this.http.getChats().then(response => {
    //   this.chats.next(response);
    // })
  }
}
