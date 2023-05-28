import { Component, ChangeDetectorRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ApplicationState } from '../services/applicationstate';
import { ChatService } from '../services/chat.service';
import { RelayService } from '../services/relay';
import { Kind } from 'nostr-tools';
import { UIService } from '../services/ui';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent {
  @ViewChild('chatSidebar', { static: false }) chatSidebar!: MatSidenav;
  @ViewChild('userSidebar', { static: false }) userSidebar!: MatSidenav;

  subscription: any;

  constructor(private appState: ApplicationState, private chatService: ChatService, private relayService: RelayService, public ui: UIService) {}
  sidebarTitles = {
    user: '',
    chat: '',
  };
  open = {
    me: this,
    userSideBar: function (title: string = '') {
      this.me.userSidebar.open();
      this.me.sidebarTitles.user = title;
    },
    chatSideBar: function (title: string = '') {
      this.me.chatSidebar.open();
      this.me.userSidebar.close();
      this.me.sidebarTitles.chat = title;
    },
  };

  async ngOnInit() {
    this.ui.clearChats();

    this.appState.updateTitle('Chat');
    this.appState.goBack = true;
    this.appState.actions = [];

    this.subscription = this.relayService.subscribe([{ kinds: [Kind.ChannelCreation, Kind.ChannelMetadata], limit: 10 }]).id;
    // this.chatService.downloadChatRooms();
  }
}
