import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import { ApplicationState } from 'src/app/services/applicationstate';
import { ChatService } from 'src/app/services/chat.service';
import { ChatModel } from 'src/app/services/interfaces';
import { MessageControlService } from 'src/app/services/message-control.service';


@Component({
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.scss']
})
export class ChatDetailComponent implements OnInit, OnDestroy {
  @ViewChild("scrollable", {static: false}) scrollable!: { nativeElement: { scrollTop: any; scrollHeight: any; }; };
  subscription!: Subscription;
  chat!: ChatModel;
  sending: boolean = false;

  constructor(private service: ChatService, private control: MessageControlService,private appState: ApplicationState) {
  }

  ngOnInit() {
    this.subscription = this.service.chat.subscribe(messages => {
      this.chat = messages;
      this.sending = false;
      this.scrollToBottom();
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      this.scrollable.nativeElement.scrollTop = this.scrollable.nativeElement.scrollHeight;
    }, 100);
  }

  saveMessage($event : any) {
    const value = $event.target.value;
    if ($event.key == "Enter" && this.control.isSendable(value)) {
      this.scrollToBottom();
      this.service.saveMessage(this.chat.id, value);
      this.sending = true;
      $event.target.value = "";
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
