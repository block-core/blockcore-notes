import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from './chat.service';
import { UserModel } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  users = new BehaviorSubject<Array<UserModel>>(null as any);
  active = new BehaviorSubject<UserModel>(null as any);

  constructor(private chatService: ChatService) {}

  getUsers() {
    return this.chatService.data.users;
  }
}
