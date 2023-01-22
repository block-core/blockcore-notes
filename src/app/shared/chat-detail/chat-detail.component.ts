import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';
import { ApplicationState } from 'src/app/services/applicationstate';
import { ChatService } from 'src/app/services/chat.service';
import { ChatModel } from 'src/app/services/interfaces';
import { MessageControlService } from 'src/app/services/message-control.service';

@Component({
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.scss'],
})
export class ChatDetailComponent implements OnInit, OnDestroy {
  @ViewChild('scrollable', { static: false }) scrollable!: { nativeElement: { scrollTop: any; scrollHeight: any } };
  @ViewChild('picker') picker: unknown;

  isEmojiPickerVisible: boolean | undefined;
  subscription!: Subscription;
  chat!: ChatModel;
  sending: boolean = false;
  message: any;
  displayList = true;

  constructor(private service: ChatService, private control: MessageControlService, private appState: ApplicationState) { }
  @ViewChild('drawer') drawer!: MatSidenav;

  ngOnInit() {

    // this.subscription = this.service.chat.subscribe((messages) => {
    //   this.chat = messages;
    //   this.sending = false;
    //   this.message = '';
    //   this.scrollToBottom();
    // });
  }

  scrollToBottom() {
    setTimeout(() => {
      this.scrollable.nativeElement.scrollTop = this.scrollable.nativeElement.scrollHeight;
    }, 100);
  }

  saveMessage($event: any) {
    this.message = $event.target.value;
    if ($event.key == 'Enter' && this.control.isSendable(this.message)) {
      this.scrollToBottom();
      this.service.saveMessage(this.chat.id, this.message);
      this.sending = true;
      $event.target.value = '';
    }
  }

  send(event: any) {
    this.message = event;
    if (this.control.isSendable(this.message)) {
      this.scrollToBottom();
      this.service.saveMessage(this.chat.id, this.message);
      this.sending = true;
      this.message = '';
    }
  }
  public addEmoji(event: { emoji: { native: any } }) {
    // this.dateControl.setValue(this.dateControl.value + event.emoji.native);
    this.message = `${this.message}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }

  public toggle() {
    this.displayList = !this.displayList;
    this.drawer.toggle();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
