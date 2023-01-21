import {Injectable} from '@angular/core';
import { ChatModel, MessageModel } from '../interfaces';
import {HttpService} from "./http.service";


@Injectable({
  providedIn: 'root'
})
export class MessageHttpService extends HttpService {
  getChats(): Promise<ChatModel[]> {
    return this.get("chats");
  }

  createChat(sourceId: number, targetId: number): Promise<ChatModel> {
    return this.get("createChat");
  }

  saveMessage(chatId: number, message: string): Promise<MessageModel> {
    return this.get("saveMessage");
  }
}
