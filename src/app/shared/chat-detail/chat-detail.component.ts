import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { Kind } from 'nostr-tools';
import { Subscription } from 'rxjs';
import { ApplicationState } from 'src/app/services/applicationstate';
import { ChatService } from 'src/app/services/chat.service';
import { ChatModel } from 'src/app/services/interfaces';
import { MessageControlService } from 'src/app/services/message-control.service';
import { RelayService } from 'src/app/services/relay';
import { UIService } from 'src/app/services/ui';
import { Utilities } from 'src/app/services/utilities';

@Component({
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.scss'],
})
export class ChatDetailComponent implements OnInit, OnDestroy {
  @ViewChild('scrollable', { static: false }) scrollable!: { nativeElement: { scrollTop: any; scrollHeight: any } };
  @ViewChild('picker') picker: unknown;

  isEmojiPickerVisible: boolean | undefined;
  chat!: ChatModel;
  sending: boolean = false;
  message: any;
  displayList = true;

  constructor(private relayService: RelayService, public ui: UIService, private service: ChatService, private activatedRoute: ActivatedRoute, private utilities: Utilities, private control: MessageControlService, private appState: ApplicationState) {}
  @ViewChild('drawer') drawer!: MatSidenav;
  subscription?: string;
  subscriptions: Subscription[] = [];

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const id: any = params.get('id');

        this.ui.clearChatMessages();
        this.relayService.unsubscribe(this.subscription!);
        this.subscription = this.relayService.subscribe([{ kinds: [Kind.ChannelMessage, Kind.ChannelMuteUser, Kind.ChannelHideMessage], ['#e']: [id], limit: 500 }]).id;

        // this.ui.clearFeed();

        // if (circle != null) {
        //   this.circle = Number(circle);
        //   this.ui.setFeedCircle(this.circle);
        // } else {
        //   this.circle = -1;
        //   this.ui.setFeedCircle(this.circle);
        // }

        // this.subscriptions.push(
        //   this.navigation.showMore$.subscribe(() => {
        //     this.showMore();
        //   })
        // );
      })
    );

    // debugger;
    // this.subscription = this.relayService.subscribe([{ kinds: [Kind.ChannelMessage, Kind.ChannelMuteUser, Kind.ChannelHideMessage], ['#e']: [this.pubkey], limit: 500 }]).id;

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
    this.relayService.unsubscribe(this.subscription!);
    this.utilities.unsubscribe(this.subscriptions);
  }
}
