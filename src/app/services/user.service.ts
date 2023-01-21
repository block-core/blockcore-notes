import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserModel } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  users = new BehaviorSubject<Array<UserModel>>(null as any);
  active = new BehaviorSubject<UserModel>(null as any);

  constructor() {}

  getUsers() {
    // this.http.getUsers().then(response => this.users.next(response));
  }
}
