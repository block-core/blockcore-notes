import {Injectable} from '@angular/core';
import { UserModel } from '../interfaces';
import {HttpService} from "./http.service";

@Injectable({
  providedIn: 'root'
})
export class UserHttpService extends HttpService {
  getUsers(): Promise<Array<UserModel>> {
    return this.get("users");
  }
}
