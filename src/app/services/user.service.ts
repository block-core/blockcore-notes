import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import { UserHttpService } from './http/user-http.service';
import { UserModel } from './interfaces';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  users = new BehaviorSubject<Array<UserModel>>(null as any);
  active = new BehaviorSubject<UserModel>(null as any);

  constructor(private http: UserHttpService) {
  }

  getUsers() {
    this.http.getUsers().then(response => this.users.next(response));
  }
}
