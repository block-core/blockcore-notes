import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { ChatModel, UserModel } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  // chats: BehaviorSubject<ChatModel[]> = new BehaviorSubject<ChatModel[]>([]);
  // chat: BehaviorSubject<ChatModel> = new BehaviorSubject<ChatModel>(null as any);

  chats: ChatModel[] = [];
  #chatsChanged: BehaviorSubject<ChatModel[]> = new BehaviorSubject<ChatModel[]>(this.chats);

  get chats$(): Observable<ChatModel[]> {
    return this.#chatsChanged.asObservable().pipe();
  }

  constructor() {
    this.chats = this.data.chats as any[];
    this.#chatsChanged.next(this.chats);

    console.log(this.data.chats);
    // this.chats$ = this.chats.asObservable();
  }

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
    return this.data.chats;
  }

  data = {
    users: [
      {
        id: 0,
        username: 'Milad',
        name: 'Milad Raeisi',
        cover: 'https://avatars.githubusercontent.com/u/6504337',
        status: 'Online',
        bio: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. ",
      },
      {
        id: 1,
        username: 'SondreB',
        name: 'Sondre',
        cover: 'https://avatars.githubusercontent.com/u/309938',
        status: 'Online',
        bio: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, ",
      },
    ],
    chats: [
      {
        id: 0,
        targetUserId: 0,
        username: 'Blockcore Channel',
        cover: 'https://avatars.githubusercontent.com/u/53176002',
        lastMessage: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.',
        lastMessageLength: 0,
        chat: [
          {
            id: '1',
            cover: 'https://avatars.githubusercontent.com/u/6504337',
            message: 'Hi',
          },
          {
            id: '1',
            cover: 'https://avatars.githubusercontent.com/u/6504337',
            message: 'How are you?',
          },
          {
            id: '0',
            cover: 'https://avatars.githubusercontent.com/u/6504337',
            message: 'Hi, I am good, you?',
          },
          {
            id: '1',
            cover: 'https://avatars.githubusercontent.com/u/6504337',
            message: 'Thank you.',
          },
        ],
      },
      {
        id: 1,
        targetUserId: 0,
        username: 'Milad',
        cover: 'https://avatars.githubusercontent.com/u/6504337',
        lastMessage: 'All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary,',
        lastMessageLength: 2,
        chat: [
          {
            id: '4',
            cover: 'https://avatars.githubusercontent.com/u/6504337',
            message: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
          },
          {
            id: '4',
            cover: 'https://avatars.githubusercontent.com/u/6504337',
            message: "Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy.",
          },
        ],
      },
      {
        id: 2,
        targetUserId: 1,
        username: 'SondreB',
        cover: 'https://avatars.githubusercontent.com/u/309938',
        lastMessage: ' Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.',
        lastMessageLength: 0,
        chat: [
          {
            id: '0',
            cover: 'https://avatars.githubusercontent.com/u/309938',
            message: 'Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.',
          },
          {
            id: '0',
            cover: 'https://avatars.githubusercontent.com/u/309938',
            message: 'Lorem ipsum dolor sit amet.',
          },
          {
            id: '0',
            cover: 'https://avatars.githubusercontent.com/u/309938',
            message: 'There is no one who loves pain itself, who seeks after it and wants to have it, simply because it is pain...',
          },
        ],
      },
    ],
    saveMessage: {
      id: 0,
      chatId: 2,
      cover: 'https://avatars.githubusercontent.com/u/53176002',
      message: 'Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.',
    },
    createChat: {
      id: 0,
      targetUserId: 1,
      username: 'Milad',
      cover: 'https://avatars.githubusercontent.com/u/6504337',
      lastMessage: '',
      lastMessageLength: 0,
      chat: [],
    },
  };
}
