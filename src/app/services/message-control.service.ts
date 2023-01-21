import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageControlService {
  isSendable(message: string) {
    return message !== "" && message.trim() !== "";
  }
}
