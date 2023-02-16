import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, distinct, flatMap, from, groupBy, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { ChatModel, NostrEventDocument, UserModel } from './interfaces';
import { QueueService } from './queue.service';
import { DataService } from './data';
import { ApplicationState } from './applicationstate';
import { NostrService } from './nostr';

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

  #chats: NostrEventDocument[] = [];
  // #chatsChanged2: BehaviorSubject<NostrEventDocument[]> = new BehaviorSubject<NostrEventDocument[]>(this.chats2);

  chats3: NostrEventDocument[] = [];

  get chats2$() {
    return of(this.#chats);
  }

  get uniqueChats$() {
    return this.chats2$.pipe(
      map((data) => {
        const sorted = data.sort((a, b) => {
          return a.created_at < b.created_at ? -1 : 1;
        });

        const filtered = sorted.filter((item, index) => sorted.findIndex((e) => e.pubkey == item.pubkey) === index);
        return filtered;
      })
    );
  }

  constructor(private nostr: NostrService, private queueService: QueueService, private dataService: DataService, private appState: ApplicationState) {
    this.chats = this.data.chats as any[];
    this.#chatsChanged.next(this.chats);
    console.log(this.data.chats);
    // this.chats$ = this.chats.asObservable();
  }

  subscriptions: Subscription[] = [];

  download() {
    // this.chats2 = [];
    this.#chats = [];

    this.dataService
      .downloadEventsByQuery([{ kinds: [4], ['#p']: [this.appState.getPublicKey()] }], 3000)
      .pipe(
        finalize(async () => {
          debugger;
          for (let index = 0; index < this.#chats.length; index++) {
            const event = this.#chats[index];
            const content = await this.nostr.decrypt(event.pubkey, event.content);
            event.content = content;
            console.log('DECRYPTED EVENT:', event);
          }
        })
      )
      .subscribe(async (event) => {
        if (this.#chats.findIndex((e) => e.id === event.id) > -1) {
          return;
        }

        // const gt = globalThis as any;
        // const content = await gt.nostr.nip04.decrypt(event.pubkey, event.content);
        // event.content = content;

        this.#chats.unshift(event);

        // this.chats2.push(event);
        // this.#chatsChanged2.next(this.chats2);
      });

    // this.subscriptions.push(this.dataService.downloadEventsByQuery([{}]));
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
